# Railway セットアップ手順

> ## 現在の構成（2026-08-14 時点・稼働中）
>
> | サービス | URL | ビルド |
> |---|---|---|
> | `mr-alignment`（フロント） | https://mr-alignment-production.up.railway.app | `Dockerfile.frontend` |
> | `mr-alignment-api`（API） | https://mr-alignment-api-production.up.railway.app | `backend/Dockerfile` |
> | `Postgres` | （内部） | Railway プラグイン |
>
> `/api/health/ready` の結果: `database: ok` / `openai: configured` / **`mail: not_configured`**
>
> **残作業: SMTP が未設定です。** この状態では、AI資料が届かないだけでなく、
> **お問い合わせ・面談予約・資料請求の通知メールも誰にも届きません**
> （データは DB に保存されますが、管理画面がないため気づけません）。
> 設定方法は「2-1」を参照してください（JCOM の `mailssl.zaq.ne.jp:465` を使う想定）。
>
> ### バックエンドの再デプロイ
>
> `mr-alignment-api` は CLI からデプロイしています（GitHub 連携ではありません）。
> ルートの `railway.json` はフロント用のため、**`--path-as-root` が必須**です。
> これを付けないとバックエンドのサービスに `Dockerfile.frontend` がビルドされます。
>
> ```bash
> railway up backend --path-as-root --service mr-alignment-api
> ```
>
> git push で自動デプロイしたい場合は、ダッシュボードで GitHub 連携を設定し、
> **Branch を `main-clean`、Root Directory を `backend`** にしてください。
>
> ### フロントエンドの再デプロイ
>
> `VITE_API_URL` はビルド時に埋め込まれるため、変数を変えたら**再ビルド**が必要です。
> `railway redeploy` は既存イメージの再配置なので反映されません。
>
> ```bash
> railway up --service mr-alignment
> ```

## 前提

バックエンドは **環境変数のみ** から設定を読み込みます（`backend/app/config.py`）。
Railway の Variables に設定した値がそのまま反映されるため、
コードや設定ファイルにキーを書く必要はありません。

pydantic-settings は `case_sensitive=False` で動作するため、
Railway 側の変数名（例: `OPENAI_API_KEY`）が
そのままフィールド（`openai_api_key`）にマッピングされます。

---

## 1. 必須の Variables

Railway ダッシュボード → プロジェクト → Variables で設定します。

| 変数名 | 値 | 備考 |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway の PostgreSQL プラグインを参照。`postgresql://` 形式は起動時に自動で `postgresql+asyncpg://` へ変換される |
| `JWT_SECRET_KEY` | 生成した長いランダム文字列 | **必須**。未設定だと本番モードで起動を拒否する |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | `true` のままだと起動を拒否する |
| `FRONTEND_URL` | `https://<Vercelのドメイン>` | CORS の許可オリジン。カンマ区切りで複数可 |
| `OPENAI_API_KEY` | `sk-...` | AI資料生成に必要。未設定なら該当APIが 503 を返す |

`JWT_SECRET_KEY` の生成:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### CLI で設定する場合

```bash
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false
railway variables set JWT_SECRET_KEY="$(python -c 'import secrets;print(secrets.token_urlsafe(48))')"
railway variables set FRONTEND_URL="https://your-app.vercel.app"
railway variables set OPENAI_API_KEY="sk-..."
```

---

## 2. 任意の Variables

| 変数名 | 既定値 | 用途 |
|---|---|---|
| `OPENAI_MODEL` | `gpt-4o-mini` | 使用モデル |
| `OPENAI_MAX_TOKENS` | `2000` | 生成上限 |
| `OPENAI_TIMEOUT` | `60` | 秒 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT の有効期間 |
| `RATE_LIMIT_AUTH` | `5/minute` | 認証エンドポイントの上限 |
| `RATE_LIMIT_CONTACT` | `10/hour` | お問い合わせの上限 |
| `RATE_LIMIT_APPOINTMENT` | `5/hour` | 面談予約（`/api/appointments`）の上限。枠を押さえる操作なので厳しめ |
| `TRUSTED_PROXY_HOPS` | `0` | X-Forwarded-For の右から何個目を本当のクライアントとみなすか。**既定の 0 ではレート制限が全体で1枠になる**。実際の段数を確認して設定する（下記「2-0」） |
| `RATE_LIMIT_OPENAI` | `10/minute` | AI生成の上限 |
| `RATE_LIMIT_DOCUMENT` | `5/hour` | 資料請求（`/api/documents`）の上限。未認証で呼べるため厳しめ |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | — | SMTP 設定。JCOM なら `mailssl.zaq.ne.jp` / `465` |
| `MAIL_USE_SSL` | `false` | ポート 465（SMTPS）で使う。465 のときは未設定でも SMTPS として扱う |
| `MAIL_USE_TLS` | `false` | ポート 587（STARTTLS）で使う。`MAIL_USE_SSL` と併用しない |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | `noreply@example.com` / `MR Alignment` | 送信元。ISP のサーバーでは `MAIL_USERNAME` と同じアドレスにすること |
| `CONTACT_MAIL_TO` | — | お問い合わせ・面談予約・資料請求の通知先。未設定だと通知が飛ばず、DB に溜まるだけになる |
| `ADMIN_EMAILS` | — | 面談予約の管理画面（`/admin/appointments`）を使えるアカウント。カンマ区切り。**未設定だと誰も開けない** |
| `WEB_CONCURRENCY` | `2` | uvicorn のワーカー数 |
| `LOG_LEVEL` | `INFO` | |
| `CORS_ALLOW_ORIGIN_REGEX` | — | Vercel プレビュー等を許可する場合 |

---

## 2-0. `TRUSTED_PROXY_HOPS` を確認して設定する

レート制限は IP 単位です。その IP は `X-Forwarded-For` から取り出しますが、
**先頭はクライアントが自称した値**で詐称できるため、
「前段のプロキシが書いた分」＝右から `TRUSTED_PROXY_HOPS` 個目を採ります
（`backend/app/dependencies.py` の `client_ip`）。

**既定は 0（ヘッダを一切信用しない）です。** 安全側ですが、副作用があります。

| 設定 | クライアント IP | レート制限 | 詐称への耐性 |
|---|---|---|---|
| `0`（既定） | プロキシの内部アドレス（全員同じ） | **全利用者で1枠**を共有 | 破られない |
| `1`（実構成と一致する場合） | 本物のクライアント | IP 単位で正しく効く | 破られない |
| `1`（実構成が2段なのに 1） | クライアントが書いた値 | **無制限に回避できる** | 破られる |

`0` のままだと、面談予約の「5/hour」が事業所全体で5件になり、
6人目以降は 429 で申し込めません。**確認して 1 に上げてください。**

### 確認手順（初回デプロイ後に1回）

アクセスログは1行1JSON で、`client_ip` が入っています。

```bash
railway logs | grep client_ip
```

`X-Forwarded-For` の中身を見たいときは、まず `TRUSTED_PROXY_HOPS=1` にして
再デプロイし、同じログの `client_ip` を確認します。

| `client_ip` の値 | 意味 | 設定 |
|---|---|---|
| `126.x.x.x` など**インターネット上のアドレス** | Railway は1段 | `TRUSTED_PROXY_HOPS=1` のままにする |
| `10.x` / `100.64.x` など**内部アドレス** | 前段が2段以上ある | `2` を試して同じ確認を繰り返す |

段数が合っていない場合は、起動後の最初のリクエストで警告も出ます。

```
TRUSTED_PROXY_HOPS=1 ですが、クライアント IP が '10.0.0.7' になりました。…
```

確認が済むまでは `0` のままにしてください。
`0` は「不便だが破られない」状態で、`1` の誤設定は「破られる」状態です。

---

## 2-1. メール送信（SMTP）を有効にする

メールが送られる場面は6つあります。**`MAIL_HOST` が未設定だと、いずれも送信されません**
（エラーにはならず、静かに送られないだけです）。

| 場面 | 宛先 | 未設定だとどうなるか |
|---|---|---|
| お問い合わせの通知 | `CONTACT_MAIL_TO` | DB には残るが**誰も気づけない**（`GET /api/contact` は本人の分しか返さない） |
| 面談予約の受付控え（自動返信） | 申込者のアドレス | 予約は入るが、申込者の手元に受付番号が残らない |
| 面談予約の通知 | `CONTACT_MAIL_TO` | 管理画面（`/admin/appointments`）で確認できるが、予約が入ったことに気づけない |
| **面談予約の確定／取消**（管理画面の操作で自動送信） | 申込者のアドレス | **確定したことが申込者に伝わらない**。管理画面に「未送信」と赤字で出るので、個別に連絡すること |
| 資料請求の通知 | `CONTACT_MAIL_TO` | DB には残るが誰も気づけない |
| AI資料の送付 | フォームに入力されたお客様のアドレス | 資料は画面に表示されるが届かない（`email_sent: false`） |

面談予約のメールは、送れたかどうかを `appointments.ack_sent` /
`appointments.staff_notified` / `appointments.status_notice_sent_at` に記録しています。
管理画面の一覧に「未送信」と赤字で出るので、「送ったつもり」を後から見分けられます。

確定・取消の連絡だけは**同期送信**です（担当者は1件ずつ操作しており、
「確定にしたのにメールが飛んでいない」ことをその場で知れたほうがよいため）。
SMTP の応答が遅いと、管理画面の操作に数十秒かかることがあります。

### JCOM（ZAQ）のメールサーバーを使う場合 ← 現在の構成

```bash
railway variables set MAIL_HOST=mailssl.zaq.ne.jp
railway variables set MAIL_PORT=465
railway variables set MAIL_USE_SSL=true
railway variables set MAIL_USERNAME="kensudo@jcom.zaq.ne.jp"
railway variables set MAIL_PASSWORD="（JCOMのメールパスワード）"
railway variables set MAIL_FROM_ADDRESS="kensudo@jcom.zaq.ne.jp"
railway variables set MAIL_FROM_NAME="須藤技術士事務所"
railway variables set CONTACT_MAIL_TO="kensudo@jcom.zaq.ne.jp"
```

> **`MAIL_USE_SSL` と `MAIL_USE_TLS` は別物です。**
> - `MAIL_USE_SSL`（ポート 465）: 接続の最初から TLS。**JCOM はこちら**
> - `MAIL_USE_TLS`（ポート 587）: 平文で接続してから TLS へ切り替える（STARTTLS）
>
> 465 に平文の SMTP で接続すると、サーバーの応答を読めずタイムアウトします。
> 取り違えを防ぐため、**ポートが 465 なら `MAIL_USE_SSL` が未設定でも SMTPS として扱います**
> （`backend/app/config.py` の `mail_ssl_required`）。

JCOM を使ううえでの注意:

- **`MAIL_FROM_ADDRESS` は必ず `MAIL_USERNAME` と同じアドレスにすること。**
  ISP のメールサーバーは、認証したアカウント以外の差出人を拒否します。
- ISP のメールには**1日あたりの送信通数の上限**があります。資料請求が増えてきたら、
  独自ドメイン＋送信専用サービス（SendGrid / Amazon SES 等）へ移すこと。
- 受信側で迷惑メール扱いされる場合は、`CONTACT_MAIL_TO` 側で受信許可に入れてください。
  自社ドメインへ移す場合は SPF / DKIM を設定します。
- パスワードは Railway の Variables にだけ置き、リポジトリには絶対に書かないこと
  （`.githooks` のフックが検知しますが、そもそも書かない）。

### 送信専用サービス（SendGrid）を使う場合

```bash
railway variables set MAIL_HOST=smtp.sendgrid.net
railway variables set MAIL_PORT=587
railway variables set MAIL_USE_TLS=true               # 587 は STARTTLS
railway variables set MAIL_USERNAME=apikey            # 文字列 "apikey" 固定
railway variables set MAIL_PASSWORD="SG.xxxxx"        # SendGrid の APIキー
railway variables set MAIL_FROM_ADDRESS="noreply@example.jp"
railway variables set MAIL_FROM_NAME="須藤技術士事務所"
railway variables set CONTACT_MAIL_TO="kensudo@jcom.zaq.ne.jp"
```

### 設定後の確認

```bash
curl -s https://mr-alignment-api-production.up.railway.app/api/health/ready
```

`"mail"` が `configured` になれば設定は読めています（送信の成否までは見ていません）。
実際に届くかは、サイトのお問い合わせフォームから1件送って確認してください。
失敗している場合は `railway logs` に `お問い合わせ通知メールの送信に失敗しました` が出ます。

補足:

- 資料メールの `Reply-To` は `CONTACT_MAIL_TO`、担当者通知の `Reply-To` は
  お客様のアドレスになります。どちらから返信しても相手に届きます。

---

## 2-2. 面談予約の管理画面を有効にする（`ADMIN_EMAILS`）

面談予約の一覧・詳細・状態変更は `/admin/appointments` で行います。
このページを開けるのは `ADMIN_EMAILS` に載っているアカウントだけです。

```bash
railway variables set ADMIN_EMAILS="kensudo@jcom.zaq.ne.jp"
```

- カンマ区切りで複数指定できます（`a@example.com,b@example.com`）。
- **未設定だと誰も開けません**（403）。設定漏れで全員が管理者になるより、
  誰も入れないほうが安全なためこの向きにしています。
- 予約には申込者の氏名・電話番号が含まれます。ログイン済みというだけでは通しません。
- DB のフラグではなく環境変数にしているのは、最初の管理者を作るために
  本番DBへ直接 SQL を打つ必要をなくすためです。権限を外すのも同じ画面でできます。

手順:

1. サイトの会員登録から、上で指定したアドレスのアカウントを作る
2. `https://<フロントエンドのドメイン>/admin/appointments` を開く
3. ログインすると一覧が表示される

`ADMIN_EMAILS` に載っていないアカウントでログインすると、
「このアカウントは管理者として登録されていません」と画面に出ます。

---

## 3. ビルド設定

**このリポジトリは Railway 上で 2 つのサービスに分けてデプロイします。**
1 つのサービスにまとめることはできません（フロントエンドは nginx、
バックエンドは uvicorn で、待ち受けるプロセスが異なるため）。

| サービス | ビルド対象 | 役割 |
|---|---|---|
| フロントエンド | `Dockerfile.frontend`（ルートの `railway.json` が指定） | LP の静的ファイルを nginx で配信 |
| バックエンド | `backend/Dockerfile` | FastAPI。**別途サービスを作成する必要がある** |

ルートの `railway.json` はフロントエンド用です。

```json
{
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile.frontend" },
  "deploy": { "startCommand": "/docker-start.sh", "restartPolicyType": "ON_FAILURE" }
}
```

### 【最初に確認】デプロイ対象のブランチ

**Settings → Source → Branch が `main-clean` になっていることを確認してください。**

`main` は 2025-08-20 で更新が止まった旧構成（Laravel時代）のブランチです。
`railway.json` も `Dockerfile.frontend` も含まれていないため、
Railway は Dockerfile を見つけられず Railpack の自動判定にフォールバックし、
次のエラーで失敗します。

```
✖ Railpack could not determine how to build the app.
```

このメッセージが出たら、まずブランチ設定を疑ってください。
ログの「The app contents that Railpack analyzed contains:」の一覧に
`railway.json` が無ければ、古いブランチを見ています。

### バックエンドサービスの作成

同じリポジトリからもう 1 つサービスを作り、Settings で指定します。

- **Source → Branch**: `main-clean`
- **Source → Root Directory**: `backend`
  （`backend/railway.json` が読み込まれ、`backend/Dockerfile` でビルドされます。
  ルートの `railway.json` はフロントエンド用なので、ここを設定しないと
  フロントエンドがもう1つ建ってしまいます）
- **Networking**: ドメインを生成（このURLをフロントエンドの `VITE_API_URL` に設定する）
- 「1. 必須の Variables」と「2-1」の環境変数を**このサービスに**設定する

- ポートは Railway が注入する `PORT` を使用します（既定 8000）
- ヘルスチェックは `/health`（DB に触らないため高速に応答）
- 依存サービスを含む確認は `/api/health/ready`

### フロントエンドサービスの Variables

| 変数名 | 値 | 備考 |
|---|---|---|
| `VITE_API_URL` | `https://<バックエンドのサービス>.up.railway.app` | **必須**。末尾に `/api` は付けない |

> **`VITE_` の変数はビルド時に成果物へ埋め込まれます。**
> 実行時に設定しても反映されません。また `Dockerfile.frontend` 側で
> `ARG` として宣言した変数だけがビルドへ渡ります。
> 未設定のままビルドしようとすると、意図的にビルドを失敗させています
> （既定値 `http://localhost:8000` が焼き込まれると、
> 画面は表示されるのに API 呼び出しだけが黙って失敗するため）。

> **`VITE_OPENAI_API_KEY` は絶対に設定しないでください。**
> `VITE_` 変数はブラウザから読み取れるため、APIキーが公開されます。
> OpenAI のキーは**バックエンドサービスの** `OPENAI_API_KEY` にのみ設定します。

---

## 4. 起動時に何が起きるか

`backend/docker-entrypoint.sh` が順に実行します。

1. **設定の検証** — `APP_DEBUG=true` や `JWT_SECRET_KEY` 未設定なら**起動を中止**
2. **DB 接続待ち** — 最大 30 回（約 60 秒）リトライ。繋がらなければ**起動を中止**
3. **マイグレーション** — `alembic upgrade head`。失敗したら**起動を中止**
4. **起動** — `uvicorn --workers ${WEB_CONCURRENCY} --proxy-headers`

> 旧 Laravel 版はマイグレーション失敗を握り潰していたため、
> スキーマ不整合のままコンテナが起動していました。現在は明示的に失敗させます。

---

## 5. 動作確認

```bash
# 稼働確認（DBに触らない）
curl https://<your-app>.up.railway.app/health

# 依存サービスを含む確認
curl https://<your-app>.up.railway.app/api/health/ready
```

`/api/health/ready` のレスポンス例:

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "openai": "configured",
    "mail": "configured"
  }
}
```

`"openai": "not_configured"` なら `OPENAI_API_KEY` が Railway に届いていません。

---

## 6. よくある問題

| 症状 | 原因 | 対処 |
|---|---|---|
| `OPENAI_API_KEY` を設定したのに反映されない | フロントエンドのサービスに設定している | このキーを読むのは**バックエンドのサービス**。nginx は環境変数を一切参照しない |
| `JWT_SECRET_KEY` を設定したのに反映されない | 変数名が `JWT_SECRET` になっている | 読み込むのは `JWT_SECRET_KEY`（`backend/app/config.py`） |
| 起動直後にクラッシュし、ログに「本番設定エラー」 | `APP_DEBUG=true` or `JWT_SECRET_KEY` 未設定 | Variables を修正 |
| 「データベースに接続できませんでした」 | `DATABASE_URL` 未設定、PostgreSQL プラグイン未追加 | `${{Postgres.DATABASE_URL}}` を設定 |
| フロントから CORS エラー | `FRONTEND_URL` が実際のドメインと不一致 | Vercel のドメインを正確に設定 |
| AI資料生成が 503 | `OPENAI_API_KEY` 未設定 | Variables に設定して再デプロイ |
| AI資料生成が 401 | 未ログイン | `/api/openai/generate` は認証必須（課金の暴走を防ぐため）。LP のフォームは認証不要の `/api/documents` を使う |
| 465 を指定したのに送信がタイムアウトする | 平文 SMTP で接続している | `MAIL_USE_SSL=true` を設定（または `MAIL_PORT=465` にする。465 なら自動で SMTPS になる） |
| `535` や `Sender address rejected` で失敗する | `MAIL_FROM_ADDRESS` が `MAIL_USERNAME` と違う | ISP のサーバーは認証したアカウント以外の差出人を拒否する。両者を同じアドレスにする |
| 資料は表示されるがメールが届かない | `MAIL_HOST` 未設定 | 「2-1. AI資料のメール送付を有効にする」を設定。レスポンスの `email_sent` が `false` になっている |
| メールが迷惑メール扱いされる | `MAIL_FROM_ADDRESS` のドメインに SPF/DKIM が未設定 | 送信ドメインの DNS を設定する |
| 資料請求が 429 | `RATE_LIMIT_DOCUMENT`（既定 5/hour・IP単位）に到達 | 正当な利用で足りなければ値を緩める |
| ログイン後すぐログアウトされる | `JWT_SECRET_KEY` が未設定で再起動のたびに変わっている | 固定値を設定 |
| レート制限が緩い | `WEB_CONCURRENCY` が 2 以上 | レート制限はプロセス内メモリのため、実効上限は「ワーカー数×設定値」になる。厳密に効かせるなら Redis 実装へ置き換える |

---

## 7. セキュリティ上の注意

- **`OPENAI_API_KEY` をフロントエンドに置かないこと。**
  `VITE_` プレフィックスの変数はビルド成果物に埋め込まれ、
  ブラウザの開発者ツールから誰でも読み取れます。
- Railway の Variables はダッシュボードから閲覧できます。
  チームメンバーの権限を確認してください。
- キーを第三者に見せてしまった場合（チャット、スクリーンショット、
  Issue へのコピペ等）は、**漏洩したものとして扱い、必ず再発行**してください。
  https://platform.openai.com/api-keys
