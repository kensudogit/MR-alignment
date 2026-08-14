# Railway セットアップ手順

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
| `RATE_LIMIT_OPENAI` | `10/minute` | AI生成の上限 |
| `RATE_LIMIT_DOCUMENT` | `5/hour` | 資料請求（`/api/documents`）の上限。未認証で呼べるため厳しめ |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_USE_TLS` | — | SMTP 設定 |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | `noreply@example.com` / `MR Alignment` | 送信元。SPF/DKIM を設定済みのドメインにすること |
| `CONTACT_MAIL_TO` | — | お問い合わせ通知先。未設定でも DB には保存される |
| `WEB_CONCURRENCY` | `2` | uvicorn のワーカー数 |
| `LOG_LEVEL` | `INFO` | |
| `CORS_ALLOW_ORIGIN_REGEX` | — | Vercel プレビュー等を許可する場合 |

---

## 2-1. AI資料のメール送付を有効にする

LP の「ITサービス資料ダウンロード（無料）」フォームは、生成した資料を
**入力されたメールアドレス宛に送信**します（`POST /api/documents`）。
これには SMTP の設定が必要です。**`MAIL_HOST` が未設定だとメールは送信されず、
資料は画面に表示されるだけになります**（エラーにはなりません）。

SendGrid を使う場合の例:

```bash
railway variables set MAIL_HOST=smtp.sendgrid.net
railway variables set MAIL_PORT=587
railway variables set MAIL_USERNAME=apikey          # 文字列 "apikey" 固定
railway variables set MAIL_PASSWORD="SG.xxxxx"      # SendGrid の APIキー
railway variables set MAIL_USE_TLS=true
railway variables set MAIL_FROM_ADDRESS="noreply@kensudo.jp"
railway variables set MAIL_FROM_NAME="須藤技術士事務所"
railway variables set CONTACT_MAIL_TO="info@kensudo.jp"
```

注意点:

- **`MAIL_FROM_ADDRESS` は SPF / DKIM を設定済みの自社ドメインにすること。**
  お客様のアドレスを From にすると、受信側で詐称と判定され届きません。
- `CONTACT_MAIL_TO` を設定すると、資料請求があったことが担当者にも通知されます。
  このフォームは DB に保存していないため、**未設定だとリード情報が残りません。**
- 資料メールの `Reply-To` は `CONTACT_MAIL_TO`、担当者通知の `Reply-To` は
  お客様のアドレスになります。どちらから返信しても相手に届きます。

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

### バックエンドサービスの作成

同じリポジトリからもう 1 つサービスを作り、Settings で指定します。

- **Build → Dockerfile Path**: `backend/Dockerfile`
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
