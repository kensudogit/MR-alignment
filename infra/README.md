# AWS 構築手順

このディレクトリの Terraform で、本番環境一式を作ります。

```
              ┌──────────────┐
  訪問者 ───▶ │  CloudFront  │──▶ S3（React のビルド成果物）
              └──────────────┘
                     │ /api の呼び出しは別ドメイン
                     ▼
              ┌──────────────┐    ┌─────────────────┐
              │  ALB + WAF   │──▶ │ ECS Fargate     │
              └──────────────┘    │ FastAPI × 2〜6  │
                                  └─────────────────┘
                                     │        │      │
                            RDS(PG15) │  ElastiCache │ SES
                                      │   (Redis)    │
```

| 層 | 使うもの | 理由 |
|---|---|---|
| フロント | S3 + CloudFront | 静的ファイルにコンテナを常時起動させない |
| API | ECS Fargate + ALB | サーバーの面倒を見ずにコンテナを動かす。オートスケールと無停止デプロイ |
| DB | RDS PostgreSQL 15 | 自動バックアップ・暗号化・マルチAZ |
| レート制限 | ElastiCache (Redis) | タスクを増やしても上限が緩まないようにする |
| メール | Amazon SES | ISP の送信数上限と到達率の問題を避ける |
| 秘密情報 | Secrets Manager | タスク定義に値を書かない |
| 監視 | CloudWatch + SNS | 5xx・メール送信失敗・DB の空き容量を検知 |

---

## 前提

- AWS アカウント（管理者権限で作業できること）
- **Route53 の公開ホストゾーン**。ドメインを他社で取得している場合は
  ネームサーバーを Route53 に向けてください
- Terraform 1.6 以上、AWS CLI v2

> **Route53 を使わない場合**
> ACM の DNS 検証・SES の DKIM・ALB と CloudFront の別名レコードを
> 手作業で登録する必要があります。`route53_zone_id` を使っている
> `aws_route53_record` を削除し、`aws_acm_certificate_validation` を外して
> 既存証明書の ARN を渡す形に書き換えてください。手数と事故の確率が上がるため、
> 特別な事情が無ければ Route53 に寄せることを勧めます。

---

## 1. tfstate の置き場を作る（最初の一度だけ）

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply
```

出力された内容を `infra/terraform/envs/prod.backend.hcl` に書きます。

---

## 2. 変数を用意する

```bash
cd infra/terraform
cp envs/prod.tfvars.example envs/prod.tfvars
```

`prod.tfvars` を編集します（`.gitignore` 済み。実値はコミットされません）。
最低限、次の5つは必ず自分の値にしてください。

| 変数 | 例 |
|---|---|
| `domain_name` | `sudo-pe.jp` |
| `route53_zone_id` | `Z0123456789ABCDEFGHIJ` |
| `mail_from_address` | `noreply@sudo-pe.jp` |
| `contact_mail_to` | `kensudo@jcom.zaq.ne.jp` |
| `alert_email` | `kensudo@jcom.zaq.ne.jp` |

---

## 3. 作る

```bash
terraform init -backend-config=envs/prod.backend.hcl
terraform plan  -var-file=envs/prod.tfvars
terraform apply -var-file=envs/prod.tfvars
```

15〜25分ほどかかります（RDS と CloudFront が長い）。
`apply` の最後に、次にやることが出力されます。

---

## 4. apply の後にやること

### 4-1. OpenAI APIキーを入れる

Terraform では値を管理していません（tfstate は平文で、
variable で受け取るとキーが state に残るため）。

```bash
aws secretsmanager put-secret-value \
  --secret-id mr-alignment-prod/openai-api-key \
  --secret-string 'sk-...'
```

### 4-2. SES の本番アクセスを申請する

**SES は初期状態がサンドボックスで、検証済みアドレス宛にしか送れません。**
この状態では、見込み客からの面談予約に控えメールが届きません。

AWS コンソール → SES → Account dashboard → Request production access
から申請します（審査に数日）。申請時には、送信するメールの種類
（フォーム送信への自動返信・予約の確定連絡）と、
バウンス時の対応方針を書きます。

### 4-3. アラートの購読を承認する

`alert_email` 宛に確認メールが2通（`-alerts` と `-ses-events`）届きます。
承認するまで通知は飛びません。

### 4-4. GitHub Actions の設定

Settings → Secrets and variables → Actions → **Variables** に、
`terraform output` の値を登録します。

| 名前 | 取得元 |
|---|---|
| `AWS_ROLE_ARN` | `terraform output github_actions_role_arn` |
| `AWS_REGION` | `ap-northeast-1` |
| `ECR_REPOSITORY` | `mr-alignment-prod-backend` |
| `ECS_CLUSTER` | `terraform output ecs_cluster_name` |
| `ECS_SERVICE` | `terraform output ecs_service_name` |
| `S3_BUCKET` | `terraform output frontend_bucket` |
| `CLOUDFRONT_ID` | `terraform output cloudfront_distribution_id` |
| `VITE_API_URL` | `terraform output api_url` |

> Secrets ではなく Variables に入れます。秘密ではなく、
> ログに出ても問題のない識別子だからです。認証は OIDC で行うため、
> アクセスキーは登録しません。

### 4-5. 最初のデプロイ

`main-clean` へ push するか、Actions から `Deploy to AWS` を手動実行します。

### 4-6. 管理者アカウントを作る

サイトの会員登録から `admin_emails` に指定したアドレスで登録し、
`https://<ドメイン>/admin/appointments` を開きます。

---

## 月額の目安（東京リージョン・小規模）

| 項目 | 構成 | 目安 |
|---|---|---|
| ECS Fargate | 0.5 vCPU / 1GB × 2タスク | 約 $35 |
| ALB | 1台 | 約 $25 |
| RDS | db.t4g.micro / シングルAZ / 20GB | 約 $20 |
| ElastiCache | cache.t4g.micro | 約 $13 |
| NAT Gateway | 1台 | 約 $35（通信量込み） |
| CloudFront + S3 | 小規模 | 約 $2 |
| WAF | 管理ルール2種 | 約 $12 |
| Secrets Manager | 4件 | 約 $2 |
| **合計** | | **約 $145 / 月** |

日本円でおよそ 2〜2.5 万円です（為替による）。

**削るなら**（可用性と引き換え）:

- `backend_desired_count = 1` … 約 $17 減。デプロイ中に瞬断が出ます
- `enable_waf = false` … 約 $12 減
- NAT を無くす構成（VPC エンドポイント + パブリックサブネット）… 約 $20 減。
  ただし設計が複雑になり、事故の余地が増えます

**上げるなら**:

- `db_multi_az = true` … 約 $20 増。DB の障害時に自動で切り替わります
- `single_nat_gateway = false` … 約 $35 増。AZ 障害に耐えます

---

## 運用

### ログを見る

```bash
# 直近のログ
aws logs tail /ecs/mr-alignment-prod-backend --follow

# エラーだけ
aws logs tail /ecs/mr-alignment-prod-backend --filter-pattern '{ $.level = "ERROR" }'

# 特定のリクエストを追う（応答ヘッダの X-Request-Id）
aws logs tail /ecs/mr-alignment-prod-backend \
  --filter-pattern '{ $.request_id = "abc123..." }'
```

ログは1行1JSONです（`request_id` / `method` / `path` / `status` /
`duration_ms` / `client_ip`）。CloudWatch Logs Insights ではこう書けます。

```
fields @timestamp, status, duration_ms, path
| filter status >= 500
| sort @timestamp desc
```

### コンテナに入る

```bash
aws ecs execute-command \
  --cluster mr-alignment-prod \
  --task <タスクID> \
  --container backend \
  --interactive --command "/bin/bash"
```

### DB に入る

RDS はプライベートサブネットにあり、直接は繋がりません。
上の `execute-command` でタスクに入ってから psql を使うか、
踏み台越しにポートフォワードしてください。

### 切り戻す

デプロイが失敗した場合は、ECS のサーキットブレーカーが自動で前の版へ戻します。
手動で戻す場合:

```bash
# 直前のタスク定義のリビジョンを指定する
aws ecs update-service \
  --cluster mr-alignment-prod \
  --service mr-alignment-prod-backend \
  --task-definition mr-alignment-prod-backend:<前のリビジョン番号>
```

フロントエンドは S3 のバージョニングが有効なので、
前の版のオブジェクトを復元して CloudFront のキャッシュを削除します。

### バックアップから戻す

RDS の自動バックアップは `db_backup_retention_days` 日分あり、
その範囲なら任意の時点に復元できます（ポイントインタイムリカバリ）。
復元は**新しいインスタンスとして**作られるため、
接続先を切り替える手順が別途必要です。

---

## 壊してしまわないための注意

- `terraform destroy` は RDS と ALB の削除保護で止まります。これは意図的です
- `aws_ecs_service` は `task_definition` の変更を無視します
  （CI がデプロイするため）。Terraform で戻したい場合は
  `ignore_changes` を一時的に外してください
- `envs/prod.tfvars` と `*.backend.hcl` はコミットしないでください
