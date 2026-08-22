# MR-alignment プロジェクトメモリ

> このドキュメントはリポジトリの「唯一の参照点」です。
> 以後の実装・調査はまずこのドキュメントを参照してください。
>
> - 対象: `C:\devphp\MR-alignment`
> - ブランチ: `main-clean`（2026-08-23 時点で `main` も同一コミット）
> - 最終更新: 2026-08-23
> - **バックエンドを Laravel(PHP) から FastAPI(Python) へ全面移行済み**

---

## システム概要

**須藤技術士事務所のITコンサルティング事業向けランディングページ（LP）** と、
それを支えるバックエンド API です。
（リポジトリ名は MR-alignment ですが、実体は `HealthcareLP` という LP です）

| 機能 | 実装状況 | 実装場所 |
|---|---|---|
| サービス紹介 LP（1ページ完結・アンカー遷移） | 稼働 | `frontend/src/components/healthcare_lp_react_tailwind_ui.jsx` |
| 開発実績（8件・Railway 公開アプリへのリンク） | 稼働 | 同上 `#portfolio` セクション |
| ブログ／記事閲覧（モーダル） | 稼働（データはソース内ハードコード） | 同上 `blogData` |
| 会員登録・ログイン | **バックエンド認証（JWT）** | `backend/app/routers/auth.py` |
| お問い合わせ | **PostgreSQL 永続化 + メール通知** | `backend/app/routers/contact.py` |
| AI 資料生成（OpenAI） | **サーバー経由・認証必須** | `backend/app/routers/ai.py` |
| 資料ダウンロードフォーム（AI資料をメール送付） | **未認証で利用可・入力アドレスへ送信** | `backend/app/routers/documents.py` |
| チャット相談 | フロント UI + バックエンド経由の AI 応答 | `frontend/src/components/ChatModal.tsx` |
| 面談予約 / 電話発信 | フロント内で完結 | `AppointmentModal.tsx` / `PhoneCallModal.tsx` |

### 旧 Laravel 版からの変更点

| 項目 | 旧（Laravel 10 / PHP 8.2） | 新（FastAPI / Python 3.11） |
|---|---|---|
| 認証 | Sanctum（DB保存トークン） | JWT（jti失効リスト + token_version） |
| ORM | Eloquent | SQLAlchemy 2.0（async） |
| マイグレーション | Laravel Migration | Alembic |
| バリデーション | Validator ファサード | Pydantic v2 |
| フロント認証 | **localStorage に平文パスワード保存** | バックエンド認証に完全移行 |
| お問い合わせ | **ログ出力のみ（永続化なし）** | PostgreSQL の `contacts` テーブル |
| OpenAI キー | **フロントに埋め込み + 公開CORSプロキシ経由** | サーバーの環境変数のみ |
| CORS | `*` + credentials（仕様上成立しない） | 明示オリジン + Bearer 認証 |
| DB 初期化 | init.sql と migration が矛盾 | Alembic に一本化 |
| 起動時 migration 失敗 | 握り潰して起動 | 失敗したら起動中止 |

---

## アーキテクチャ

```text
┌──────────────────────────────────────────────────────────────┐
│ ブラウザ                                                      │
│  React 18 + Vite 4 + TypeScript + Tailwind CSS 3             │
│  └─ App.tsx → AuthProvider(JWT) → HealthcareLP                │
│      ├─ AuthModal / ChatModal                                │
│      ├─ AppointmentModal / PhoneCallModal                    │
│      └─ BlogModal / ArticleModal / FeatureModal              │
│                                                              │
│  services/api.ts       … 唯一の API クライアント（axios）      │
│  services/aiContent.ts … プロンプト組み立て・整形              │
└───────────────────────────┬──────────────────────────────────┘
                            │ Bearer トークン（Cookie 不使用）
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ FastAPI (Python 3.11) / uvicorn                              │
│  main.py … CORS / 例外ハンドラ / ルーター登録                  │
│   ├─ routers/health.py   /health, /api/health/ready, /api/test│
│   ├─ routers/auth.py     register, login, logout, me,         │
│   │                      profile, change-password             │
│   ├─ routers/contact.py  作成・一覧・詳細                     │
│   └─ routers/ai.py       openai/generate（認証必須）          │
│  dependencies / security / rate_limit / services              │
└───────────────────────────┬──────────────────────────────────┘
                            │ SQLAlchemy 2.0 async / asyncpg
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ PostgreSQL 15   users / contacts / revoked_tokens            │
└──────────────────────────────────────────────────────────────┘
```

### 設計上の要点

- **非同期一貫**: ルーターから DB・HTTP まで async（`asyncpg` / `httpx`）
- **Cookie 非依存**: Bearer トークン方式。Edge のサードパーティ Cookie 制限の影響を受けない
- **設定は環境変数のみ**: `pydantic-settings`。本番で危険な設定なら**起動を拒否**
- **秘密情報はサーバーのみ**: フロントは API キーを一切持たない

---

## ディレクトリ構成

```text
MR-alignment/
├── docs/
│   ├── project-memory.md       ← 本ドキュメント
│   ├── railway-setup.md        Railway の Variables 設定手順
│   └── secret-removal.md       git 履歴からのシークレット除去手順
│
├── backend/                    FastAPI + PostgreSQL
│   ├── app/
│   │   ├── main.py             アプリ本体・CORS・例外ハンドラ
│   │   ├── config.py           設定（環境変数）と本番検証
│   │   ├── database.py         非同期エンジン・セッション
│   │   ├── dependencies.py     認証ガード・DBセッション注入
│   │   ├── security.py         bcrypt / JWT
│   │   ├── rate_limit.py       スライディングウィンドウ制限
│   │   ├── models/             base / user / contact / revoked_token
│   │   ├── schemas/            auth / contact / ai / document
│   │   ├── routers/            health / auth / contact / ai / documents
│   │   └── services/           openai_client / mailer / document
│   ├── migrations/versions/0001_initial_schema.py
│   ├── tests/                  pytest（59 ケース）
│   ├── alembic.ini / pyproject.toml
│   ├── Dockerfile              マルチステージ・非rootユーザー
│   ├── docker-entrypoint.sh    設定検証→DB待ち→migrate→起動
│   └── .env.example
│
├── frontend/                   React + Vite
│   ├── public/portfolio/       開発実績の画像（SVG 8点）
│   ├── src/
│   │   ├── components/
│   │   │   ├── healthcare_lp_react_tailwind_ui.jsx  ★LP本体
│   │   │   ├── AuthModal / ChatModal / AppointmentModal
│   │   │   ├── PhoneCallModal / CookieConsent       ※以上 使用中
│   │   │   ├── ScrollToHash.tsx      ルート遷移後のアンカー移動
│   │   │   └── ContactModal                        ※未使用（T-10で導線追加予定）
│   │   ├── pages/
│   │   │   ├── ProcessPage.tsx        開発の進め方（/process）
│   │   │   └── CodingAgentsPage.tsx   コーディングエージェント講習（/coding-agents）
│   │   ├── contexts/AuthContext.tsx   JWT 認証
│   │   ├── services/api.ts            唯一の API クライアント
│   │   ├── services/aiContent.ts      プロンプト組み立て
│   │   └── utils/legacyStorageCleanup.ts  旧localStorage の掃除
│   └── vite.config.ts / tailwind.config.js / vercel.json
│
├── database/init/01-init.sql   PostgreSQL 拡張のみ（テーブル定義なし）
├── docker-compose.yml          postgres / backend / frontend / mailpit / pgadmin
├── Dockerfile.frontend         フロントエンド本番用（ルートの railway.json が参照）
├── railway.json                Railway 設定（フロントエンド用）
├── docker-start.bat / docker-stop.bat / docker-logs.bat
└── README.md
```

> ルート直下は README.md のみを残し、Laravel 時代の作業ログ（`.md` 34本）と
> 一度きりの作業スクリプト（`.bat`/`.sh` 22本）、
> 本プロジェクトと無関係なサンプルコード（`*_auto_response.py` 等 13本）、
> LP 比較用のダンプ（`_*_lp.jsx` 等 7本）は削除済みです。
> 参照が必要な場合は git 履歴から取得してください。

---

## 使用ライブラリ

### バックエンド（`backend/pyproject.toml`）

| ライブラリ | バージョン | 用途 |
|---|---|---|
| `fastapi` | >=0.110 | Web フレームワーク |
| `uvicorn[standard]` | >=0.29 | ASGI サーバー |
| `sqlalchemy[asyncio]` | >=2.0.29 | ORM（async） |
| `asyncpg` | >=0.29 | PostgreSQL 非同期ドライバ |
| `alembic` | >=1.13 | マイグレーション |
| `pydantic` / `pydantic-settings` | >=2.6 / >=2.2 | 検証・設定 |
| `email-validator` | >=2.1 | メールアドレス検証 |
| `python-jose[cryptography]` | >=3.3 | JWT |
| `passlib[bcrypt]` + `bcrypt` | >=1.7.4 / <5.0 | パスワードハッシュ |
| `httpx` | >=0.27 | OpenAI 呼び出し |

開発依存: `pytest`, `pytest-asyncio`, `aiosqlite`, `ruff`, `mypy`

> メール送信は標準ライブラリ `smtplib`（`asyncio.to_thread` 経由）。依存を増やしていません。

### フロントエンド（`frontend/package.json`）

| ライブラリ | バージョン | 実使用 |
|---|---|---|
| `react` / `react-dom` | ^18.2.0 | ✅ |
| `react-router-dom` | ^7.18.2 | ✅ `/process` `/coding-agents` の追加に伴い再導入 |
| `axios` | ^1.6.0 | ✅ |
| `prop-types` | ^15.8.1 | ✅ |

> `framer-motion` は未使用のため削除済み。

開発依存: `vite` ^4.4.5, `typescript` ^5.0.2, `tailwindcss` ^3.4.0, `eslint` 一式 ほか

---

## API一覧

プレフィックスは `API_PREFIX`（既定 `/api`）。

| メソッド | パス | 認証 | レート制限 | 概要 |
|---|---|---|---|---|
| GET | `/` | 不要 | — | 稼働確認・エンドポイント一覧 |
| GET | `/health` | 不要 | — | 生存確認（DB に触れない） |
| GET | `/api/health` | 不要 | — | 同上 |
| GET | `/api/health/ready` | 不要 | — | DB 疎通を含む確認 |
| GET | `/api/test` | 不要 | — | 接続テスト |
| POST | `/api/auth/register` | 不要 | 5/分 | 登録＋トークン発行 |
| POST | `/api/auth/login` | 不要 | 5/分 | ログイン |
| POST | `/api/auth/logout` | **要** | — | 現在のトークンのみ失効 |
| GET | `/api/auth/me` | **要** | — | 自分の情報 |
| PUT | `/api/auth/profile` | **要** | — | name / organization / role を更新 |
| POST | `/api/auth/change-password` | **要** | 5/分 | 変更後、全トークンを失効 |
| POST | `/api/contact` | 任意 | 10/時 | 受付（DB保存＋メール通知） |
| GET | `/api/contact` | **要** | — | 自分の問い合わせ一覧 |
| GET | `/api/contact/{reference}` | **要** | — | 詳細（他人のものは 404） |
| POST | `/api/openai/generate` | **要** | 10/分 | AI 資料生成 |
| POST | `/api/documents` | 不要 | 5/時 | AI 資料を生成し、入力されたメールアドレスへ送付。生成結果はDBへ記録 |
| GET | `/api/documents/records` | **要** | — | 生成した資料の一覧（状態で絞り込み可） |
| GET | `/api/documents/records/stats` | **要** | — | 学習データの貯まり具合 |
| GET | `/api/documents/records/{reference}` | **要** | — | 生成物・最新版・手直し履歴 |
| POST | `/api/documents/records/{reference}/revisions` | **要** | — | 人が手直しした版を登録（部分更新） |
| PATCH | `/api/documents/records/{reference}/status` | **要** | — | 状態変更（generated/reviewed/sent/rejected） |
| GET | `/api/documents/training/summary` | **要** | — | 書き出せる件数の確認 |
| GET | `/api/documents/training/export` | **要** | — | 学習データを JSONL で書き出す |
| GET | `/api/documents/training/evaluation` | **要** | — | 手直し量から生成品質を測る |

### 主要リクエスト／レスポンス

#### `POST /api/auth/register` → 201

```jsonc
// Request
{ "name": "1-255", "email": "email形式・unique",
  "password": "8文字以上・英字と数字を含む・72バイト以内",
  "password_confirmation": "password と一致",
  "organization": "optional", "role": "optional" }
// Response
{ "status": "success", "message": "...", "user": {...},
  "token": "<JWT>", "token_type": "bearer", "expires_in": 86400 }
```

#### `POST /api/contact` → 201

```jsonc
// Request（camelCase を受け付ける）
{ "name", "email", "organization?", "role?", "subject",
  "message": "max 2000",
  "contactMethod": "email|phone|both", "urgency": "low|normal|high|urgent" }
// Response
{ "status": "success", "message": "...",
  "contact_id": "CT-20260802-A1B2C3D4", "submitted_at": "..." }
```

#### `POST /api/openai/generate` → 200（**認証必須**）

```jsonc
// Request（apiKey は受け付けない）
{ "prompt": "max 4000",
  "userInfo": { /* 許可キーのみ: name, organization, role,
                   industry, email, interest, budget。他は破棄 */ } }
// Response { "success": true, "content": "..." }
// 401 未認証 / 422 入力不正 / 502 OpenAI失敗 / 503 APIキー未設定
```

### エラーレスポンスの共通形

```jsonc
// 422
{ "status": "error", "message": "バリデーションエラー",
  "errors": { "email": ["value is not a valid email address"] } }
// その他
{ "status": "error", "message": "..." }
```

> 想定外の例外はスタックトレースを**サーバーログにのみ**出力し、クライアントへは返しません。

---

## DB設計

**PostgreSQL 15**。接続は `DATABASE_URL`。
`postgresql://` や Railway 形式の `postgres://` は起動時に `postgresql+asyncpg://` へ自動変換されます。

### `users`

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| `id` | integer | PK | |
| `name` | varchar(255) | NOT NULL | |
| `email` | varchar(255) | NOT NULL, UNIQUE, INDEX | |
| `hashed_password` | varchar(255) | NOT NULL | bcrypt。平文は保存しない |
| `organization` | varchar(255) | NULL | 旧実装で欠落していたカラム |
| `role` | varchar(255) | NULL | 同上 |
| `is_active` | boolean | NOT NULL, default true | |
| `email_verified_at` | timestamptz | NULL | |
| `last_login_at` | timestamptz | NULL | |
| `token_version` | integer | NOT NULL, default 0 | パスワード変更で+1し全トークン失効 |
| `created_at` / `updated_at` | timestamptz | NOT NULL | |

### `contacts`

| カラム | 型 | 制約 |
|---|---|---|
| `id` | integer | PK |
| `reference` | varchar(32) | NOT NULL, UNIQUE, INDEX（`CT-YYYYMMDD-XXXXXXXX`） |
| `user_id` | integer | FK→users, NULL, ON DELETE SET NULL |
| `name` / `email` | varchar(255) | NOT NULL（email は INDEX） |
| `organization` / `role` | varchar(255) | NULL |
| `subject` | varchar(255) | NOT NULL |
| `message` | text | NOT NULL（最大 2000 文字） |
| `contact_method` | enum | email / phone / both |
| `urgency` | enum | low / normal / high / urgent |
| `status` | enum | new / in_progress / closed |
| `ip_address` | varchar(45) | NULL（IPv6 対応） |
| `user_agent` | varchar(512) | NULL |
| `responded_at` | timestamptz | NULL |
| `created_at` / `updated_at` | timestamptz | NOT NULL |

複合インデックス `ix_contacts_status_created_at (status, created_at)`。

### `generated_documents` / `document_revisions`

AI資料の記録。ファインチューニングの教師データはここからしか作れない。

| テーブル | 役割 |
|---|---|
| `generated_documents` | AIが生成したものを**そのまま**保存。入力・モデル・プロンプト版も残す |
| `document_revisions` | 人が手直しした版。何度でも積める。最後が最新 |

**この2つの差分が学習データになる。** 価値があるのはAIの出力ではなく、
人が直した後の文章なので、生成物を上書きせず別テーブルへ積む。

- `status` が `reviewed` / `sent` かつ手直しがあるものだけが学習対象。
  生成したままのものを教師データにすると、AIの出力でAIを学習させることになる
- `prompt_version` を残すのは、プロンプトを変えた前後の出力が混ざると
  文体が安定しないため。プロンプトを変更したら
  `app/services/document.py` の `PROMPT_VERSION` を必ず上げること
- 手直しは**部分更新**。直した節だけ送れば、残りは直前の内容を引き継ぐ

### ファインチューニングの進め方

```text
GET /api/documents/training/evaluation   まず品質を測る
GET /api/documents/training/summary      件数を確認
GET /api/documents/training/export       JSONL を書き出す
```

**着手前に evaluation を見ること。** `untouched_rate`（一度も手が入らなかった
割合）が高ければ、そもそも学習は不要。`worst_sections` が示す節だけ
プロンプトを直すほうが安く早い。

書き出しは `finetune_minimum_examples`（既定 100）未満だと **409 で拒否**する。
足りないまま学習しても文体は安定せず、費用と時間だけがかかる。
どうしても試す場合は `force=true`。

> **system / user は生成時とまったく同じ関数（`build_prompt` /
> `build_user_message`）を通している。** 別々に組み立てると
> 「学習したプロンプトと本番のプロンプトが違う」状態になり、学習しても
> 効果が出ない。`services/document.py` の `PromptSource` プロトコルが
> 生成時（`DocumentRequest`）と学習時（保存済みレコード）の両方を受ける。
>
> プロンプトを変更したら `PROMPT_VERSION` を上げること。版が混ざったまま
> 教師データにすると文体が安定しない。

### `revoked_tokens`

| カラム | 型 | 制約 |
|---|---|---|
| `id` | integer | PK |
| `jti` | varchar(64) | NOT NULL, UNIQUE, INDEX |
| `user_id` | integer | FK→users, NULL, ON DELETE CASCADE |
| `expires_at` | timestamptz | NOT NULL, INDEX |
| `revoked_at` | timestamptz | NOT NULL |

### トークン失効の二段構え

| 操作 | 仕組み | 効果 |
|---|---|---|
| ログアウト | `revoked_tokens` に jti を記録 | そのトークンのみ失効 |
| パスワード変更 | `users.token_version` を +1 | 発行済み全トークンが失効 |

### マイグレーション

```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "説明"
alembic downgrade -1
```

> `database/init/01-init.sql` は PostgreSQL 拡張の有効化のみ。
> **テーブル定義を書いてはいけません**（旧版はここで users を UUID 主キーで作り、
> マイグレーションと矛盾していました）。

---

## ER図

```mermaid
erDiagram
    users ||--o{ contacts : "問い合わせ（任意）"
    users ||--o{ revoked_tokens : "失効トークン"

    users {
        integer id PK
        varchar name "255"
        varchar email UK "255, UNIQUE"
        varchar hashed_password "255, bcrypt"
        varchar organization "255, NULL"
        varchar role "255, NULL"
        boolean is_active "default true"
        timestamptz email_verified_at "NULL"
        timestamptz last_login_at "NULL"
        integer token_version "default 0"
        timestamptz created_at
        timestamptz updated_at
    }

    contacts {
        integer id PK
        varchar reference UK "32, UNIQUE"
        integer user_id FK "NULL, SET NULL"
        varchar name "255"
        varchar email "255"
        varchar organization "255, NULL"
        varchar role "255, NULL"
        varchar subject "255"
        text message "max 2000"
        enum contact_method "email/phone/both"
        enum urgency "low/normal/high/urgent"
        enum status "new/in_progress/closed"
        varchar ip_address "45, NULL"
        varchar user_agent "512, NULL"
        timestamptz responded_at "NULL"
        timestamptz created_at
        timestamptz updated_at
    }

    revoked_tokens {
        integer id PK
        varchar jti UK "64, UNIQUE"
        integer user_id FK "NULL, CASCADE"
        timestamptz expires_at
        timestamptz revoked_at
    }
```

---

## Railway構成

詳細は **`docs/railway-setup.md`**。

### `railway.json`

**フロントとバックエンドで 2 サービスに分けてデプロイします。**

| サービス | 設定ファイル | Root Directory |
|---|---|---|
| フロントエンド | ルートの `railway.json`（`Dockerfile.frontend`） | （ルート） |
| バックエンド | `backend/railway.json`（`backend/Dockerfile`） | `backend` |

```json
// ルート（フロントエンド）
{ "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile.frontend" } }
// backend/railway.json（バックエンド）
{ "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile" } }
```

> **GitHub への push では Railway へ反映されません（2026-08-22 時点）。**
> `mr-alignment` サービスはリポジトリと連携済み（`source.repo` あり）ですが、
> 稼働中のデプロイは 2026-08-14 の `railway up`（CLI）で、それ以降の push では
> デプロイが作られていません。`main` 側の 2026-08-16 のコミットでも発火していないため、
> 監視ブランチの問題ではなく自動デプロイ自体が動いていないと見られます。
>
> 反映するときは CLI を使ってください。**サービス名の指定が必須**です
> （CLI にリンクされているのは `mr-alignment-api` の方なので、省略すると
> バックエンドへデプロイしてしまいます）。
>
> ```bash
> railway up --service mr-alignment      # フロントエンド（ルートの railway.json）
> railway up --service mr-alignment-api  # バックエンド（backend/ で実行）
> ```
>
> 自動デプロイを復旧させる場合は、Railway の Settings → Source で
> 監視ブランチと自動デプロイの有効／無効を確認してください。
>
> **`main` と `main-clean` は 2026-08-23 に同一コミットへ揃えました**（fast-forward）。
> どちらを監視ブランチにしても同じものがデプロイされます。以後どちらか一方だけに
> コミットすると再び差が開くので、push 先を固定するか、I-11 のとおり片方へ寄せてください。
>
> （かつてここには「`main` は 2025-08-20 で止まっており `railway.json` を含まない」と
> 書かれていましたが、その後 `main` は更新されており、記述が古くなっていました）
>
> 旧版は `railway.json` と `railway.toml` が同内容を二重定義していました。toml は削除済み。

### Railway Variables（必須）

設定した環境変数は `pydantic-settings`（`case_sensitive=False`）により
そのままアプリ設定へマッピングされます。**コード変更は不要です。**

| 変数名 | 値 |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET_KEY` | ランダムな長い文字列 |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `FRONTEND_URL` | Vercel のドメイン |
| `OPENAI_API_KEY` | `sk-...` |

`APP_DEBUG=true` や `JWT_SECRET_KEY` 未設定のまま本番デプロイすると、
`config.py` の検証により**起動が中止**されます。

### 起動シーケンス（`backend/docker-entrypoint.sh`）

1. 設定検証 → 失敗なら**起動中止**
2. DB 接続待ち（最大30回・約60秒）→ 失敗なら**起動中止**
3. `alembic upgrade head` → 失敗なら**起動中止**
4. `uvicorn --workers ${WEB_CONCURRENCY:-2} --proxy-headers`

---

## Docker構成

### `docker-compose.yml`（ローカル開発）

| サービス | イメージ／ビルド | ポート | 用途 |
|---|---|---|---|
| `postgres` | `postgres:15` | 5432 | DB |
| `backend` | `./backend/Dockerfile` | 8000 | FastAPI |
| `frontend` | `./frontend/Dockerfile` | 3000 | Vite dev server |
| `mailpit` | `axllent/mailpit` | 8025 / 1025 | 送信メールをブラウザで確認 |
| `pgadmin` | `dpage/pgadmin4` | 8081 | DB 管理 |

パスワード類は環境変数で上書き可能（`${POSTGRES_PASSWORD:-password}` 等）。
`OPENAI_API_KEY` は compose に直接書かず、ホストの環境変数から渡します。

### `backend/Dockerfile`

| ステージ | ベース | 内容 |
|---|---|---|
| builder | `python:3.11-slim` | `build-essential` / `libpq-dev` を入れて venv に依存をインストール |
| runtime | `python:3.11-slim` | `libpq5` のみ。venv をコピー。**非root（appuser, uid 1000）で実行** |

`HEALTHCHECK` で `/health` を確認。`PORT` は Railway が注入（既定 8000）。

### Dockerfile 一覧

| ファイル | 対象 | 用途 |
|---|---|---|
| `backend/Dockerfile` | バックエンド | 開発・本番・Railway 共通 |
| `frontend/Dockerfile` | フロントエンド | ローカル開発 |
| `Dockerfile.frontend` | フロントエンド | 本番（nginx、`$PORT` 対応） |

> `frontend/Dockerfile.prod` は `Dockerfile.frontend` と重複していたため削除済み。

---

## 環境変数一覧

### バックエンド（`backend/.env.example` にテンプレートあり）

**アプリ**

| 変数名 | 既定値 | 備考 |
|---|---|---|
| `APP_NAME` | `MR Alignment API` | |
| `APP_ENV` | `local` | local / test / staging / production |
| `APP_DEBUG` | `false` | 本番で `true` なら**起動拒否** |
| `API_PREFIX` | `/api` | |
| `LOG_LEVEL` | `INFO` | |

**データベース**

| 変数名 | 既定値 | 備考 |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:password@localhost:5432/mr_alignment` | `postgres://` / `postgresql://` は自動変換 |
| `DB_ECHO` | `false` | SQL ログ |
| `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` | `5` / `10` | |
| `DB_POOL_RECYCLE` | `1800` | アイドル接続の作り直し間隔（秒） |

**認証**

| 変数名 | 既定値 | 備考 |
|---|---|---|
| `JWT_SECRET_KEY` | 起動ごとにランダム生成 | **本番では必須**。未設定なら起動拒否 |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | |

**CORS**

| 変数名 | 既定値 | 備考 |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:3000` | カンマ区切りで複数可。`*` は禁止 |
| `CORS_ALLOW_ORIGIN_REGEX` | なし | Vercel プレビュー等 |

**OpenAI**

| 変数名 | 既定値 |
|---|---|
| `OPENAI_API_KEY` | なし（未設定なら該当APIが 503） |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `OPENAI_ENDPOINT` | `https://api.openai.com/v1/chat/completions` |
| `OPENAI_MAX_TOKENS` / `OPENAI_TEMPERATURE` / `OPENAI_TIMEOUT` | `2000` / `0.7` / `60` |

**メール**

| 変数名 | 既定値 |
|---|---|
| `MAIL_HOST` / `MAIL_PORT` | なし / `1025` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | なし |
| `MAIL_USE_TLS` | `false` |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | `noreply@example.com` / `MR Alignment` |
| `CONTACT_MAIL_TO` | なし（未設定でも DB には保存される） |

**レート制限**

| 変数名 | 既定値 |
|---|---|
| `RATE_LIMIT_AUTH` | `5/minute` |
| `RATE_LIMIT_CONTACT` | `10/hour` |
| `RATE_LIMIT_OPENAI` | `10/minute` |
| `RATE_LIMIT_DOCUMENT` | `5/hour`（未認証で呼べるため厳しめ） |

### フロントエンド

| 変数名 | 必須 | 既定値 | 備考 |
|---|---|---|---|
| `VITE_API_URL` | ○ | `http://localhost:8000` | **オリジンのみ**。`/api` は付けない |
| `VITE_ENVIRONMENT` | — | `development` | |

> `VITE_API_URL` は **ビルド時**に成果物へ埋め込まれます。実行時の環境変数では
> 差し替わりません。`Dockerfile.frontend` で `ARG` として宣言した変数のみが
> ビルドへ渡り、未設定ならビルドを失敗させています。

> 🔴 **`VITE_` プレフィックスの変数はビルド成果物に埋め込まれ、
> ブラウザから読み取れます。秘密情報は絶対に置かないでください。**

---

## 画面一覧

**2ページ構成（react-router-dom）**。LP 内のナビゲーションはアンカーでページ内スクロールし、
詳細はモーダルで表示します。

### ルート

| パス | コンポーネント | 内容 |
|---|---|---|
| `/` | `healthcare_lp_react_tailwind_ui.jsx` | LP 本体 |
| `/process` | `pages/ProcessPage.tsx` | 開発の進め方（要件整理〜デプロイの10工程 + レガシー移行 `#migration`） |
| `/coding-agents` | `pages/CodingAgentsPage.tsx` | OpenAI Codex と Claude Code の実務講習（10章＋演習） |
| その他 | 同上 LP | 未知のパスは LP を返す |

> ホスティング側は Vercel の `rewrites` と nginx の `try_files` で
> すべて `index.html` に寄せてあるため、`/process` を直接開いても 404 になりません。
>
> `ScrollToHash` コンポーネントが、`/process` から `/#portfolio` のように
> 別ページのアンカーへ戻る導線を処理します（遷移直後は対象要素が未描画のため）。
>
> 🔴 `CodingAgentsPage.tsx` は**外部ツールの仕様**（コマンド・設定キー・モデル料金）を載せています。
> ページ内に確認時点を表示しているので、内容を更新したら `FACT_CHECKED_ON` も必ず併せて更新すること。
> Codex 側の記載は learn.chatgpt.com の公式ドキュメント、Claude 側のモデルIDと料金は
> Anthropic の料金表に一致させています。推測で書き足さないこと。

### LP のセクション

| # | アンカー | 名称 |
|---|---|---|
| 1 | （先頭） | ヒーロー（キャッチコピー・CTA・統計） |
| 2 | `#features` | 機能（サービス紹介カード） |
| 3 | `#portfolio` | 開発実績（8件） |
| 4 | `#blog` | ブログ・ニュース |
| 5 | `#faq` | よくある質問 |
| 6 | （フッタ） | リンク集 |

> 導入効果（`#cases`）と料金（`#pricing`）のセクションは削除済みです。
> 実在しない企業の数値と月額料金を載せていたため、ヘッダー／フッターの
> 導線ごと外しました。

### 開発実績（`#portfolio`）

カードをクリックすると別タブで公開アプリが開きます。
画像は `frontend/public/portfolio/*.svg`（自作。ラスタ画像に差し替える場合は
`imageUrl` を変更するだけで動作します）。

| # | タイトル | URL | 画像 |
|---|---|---|---|
| 1 | SaaS対応FXツール | `https://fx-production-f5d5.up.railway.app/` | `fx-saas.svg` |
| 2 | エネルギーリソースアグリゲーション | `https://renewableenergy-production-8368.up.railway.app/` | `energy-aggregation.svg` |
| 3 | 領収書 自動データ化システム | `https://ocr-production-0e14.up.railway.app/` | `receipt-ocr.svg` |
| 4 | AI × WordPress 自動化ワークフロー | `https://wpaipublisher-production.up.railway.app/guide` | `wp-ai-publisher.svg` |
| 5 | 株価予測・SNS運用AIエージェント | `https://stockpriceppredictiontool-production.up.railway.app/` | `ai-agent-stock.svg` |
| 6 | 生成AIサービスのクラウド基盤 | `https://bedrockknowledgebase-production.up.railway.app` | `cloud-infra.svg` |
| 7 | ChatGPT Skillsカタログアプリ | `https://chatgptskillscatalog-production.up.railway.app/` | `skills-catalog.svg` |
| 8 | D2C Marketing Automation | `https://d2c-marketing-automation-production.up.railway.app/` | `d2c-marketing.svg` |

各項目は `title / description / detailedDescription / url / image / imageUrl /
icon / tech / features / industry / duration / team` を持ちます。
`duration` と `team` は暫定値です。実績に合わせて更新してください。

### モーダル（使用中）

| モーダル | ファイル | バックエンド連携 |
|---|---|---|
| ログイン／新規登録 | `AuthModal.tsx` | `/api/auth/login`, `/api/auth/register` |
| チャット | `ChatModal.tsx` | `/api/openai/generate`（未認証時は定型応答） |
| 面談予約 | `AppointmentModal.tsx` | なし |
| 電話発信 | `PhoneCallModal.tsx` | なし |
| ブログ一覧／記事詳細／機能詳細 | `healthcare_lp` 内で定義 | なし |
| Cookie 同意 | `CookieConsent.tsx` | なし |

### モーダル（実装済みだが未使用）

| モーダル | 状況 |
|---|---|
| `ContactModal.tsx` | `/api/contact` に接続済み。**導線を追加すれば使える**（T-10） |

> 旧 `AIImageModal.tsx` / `ReportModal.tsx` は存在しないエンドポイントを呼ぶ
> 別ドメインの残骸だったため削除済み。
> `DownloadModal.jsx` は LP のリードフォーム（`/api/documents`）と機能が重複し
> どこからも開かれていなかったため削除。`DemoModal.tsx` も未使用のため削除。

---

## テスト

### バックエンド

```bash
cd backend
pip install -e ".[dev]"
pytest
```

`tests/` に 101 ケース。SQLite（aiosqlite）のインメモリ DB を使い、
PostgreSQL / OpenAI / SMTP へは接続しません。

| ファイル | 検証内容 |
|---|---|
| `test_auth.py` | 登録・ログイン・ログアウト・プロフィール・パスワード変更、organization/role の保存、ハッシュ化、応答の一様性、トークン失効 |
| `test_contact.py` | DB 永続化、受付番号の一意性、IP/UA 記録、メール失敗時の継続、他人の問い合わせ不可視 |
| `test_ai.py` | 認証必須、apiKey の無視、未知キーの除去、内部情報の非漏洩 |
| `test_documents.py` | 未認証での利用、入力アドレスへの送付、プロンプト差し替えの拒否、HTMLエスケープ、生成失敗時に送信しないこと |
| `test_config_and_health.py` | 本番設定の検証、URL 変換、レート制限、CORS、ヘルスチェック |

> `bcrypt` は 5.0 以降で passlib と非互換になり「password cannot be longer than
> 72 bytes」で認証系が全滅します。`pyproject.toml` の `bcrypt<5.0` は必ず守ること。

### フロントエンド

```bash
cd frontend
npx tsc --noEmit    # 型チェック（通過を確認済み）
npm run lint
npm run build
```

> テストフレームワークは未導入。Vitest + Testing Library の導入を推奨します。

---

## 改善候補

### 🟠 P2: 設計・構造

**I-01. `healthcare_lp_react_tailwind_ui.jsx` を分割する**

約 2,300 行の単一ファイルに、アイコン定義・データ・小コンポーネント・
3 つのモーダル・15 個の状態・CSS 文字列が同居しています。

```text
src/
├── pages/LandingPage.tsx
├── sections/{Hero,Features,Cases,Portfolio,Pricing,Blog,Faq,Footer}Section.tsx
├── components/ui/{Stat,FeatureCard,Badge,Input,Select}.tsx
├── components/modals/{Blog,Article,Feature}Modal.tsx
└── data/{blogData,featureData,portfolioData}.ts   ★ソースから分離
```

**I-02. `ContactModal` に導線を追加する** — バックエンドの `/api/contact` は
完成していますが、呼び出す `ContactModal` がどこからも開かれていません。

**I-03. レート制限を共有ストアへ移す** — 現在はプロセス内メモリのため、
`WEB_CONCURRENCY` を増やすと実効上限が「ワーカー数 × 設定値」に緩みます。

**I-04. 管理者ロールと問い合わせ管理画面** — `GET /api/contact` は現状
「自分の問い合わせ」しか返しません。`users.role` で権限判定を追加すれば全件を扱えます。

**I-05. 未使用コードの削除** — ✅ 完了（2026-08-14）

**I-06. ドキュメントとスクリプトの整理** — ✅ 完了（2026-08-14）

### 🟡 P3: 品質・運用

| ID | 内容 |
|---|---|
| I-07 | フロントエンドに Vitest + Testing Library を導入 |
| I-08 | GitHub Actions で `pytest` / `ruff` / `mypy` / `tsc` / `lint` を自動実行 |
| I-09 | `console.log` を削除（terser `drop_console` で一括可能） |
| I-10 | `revoked_tokens` の期限切れレコードを定期削除 |
| I-11 | `main` / `main-clean` ブランチの統合（2026-08-23 に両者を同一コミットへ揃えた。残すブランチの決定と、もう一方の削除が未了） |
| I-12 | 構造化ログ（JSON）とリクエストIDの付与 |

---

## TODO一覧

### 🔴 緊急

| ID | 内容 | 状況 |
|---|---|---|
| **T-01** | **OpenAI API キーを再発行する** | ⚠️ **未完了**。履歴からは除去済みだが、既存の clone・GitHub のキャッシュ・フォークから取り出せる可能性が残る。**漏洩したものとして扱い、必ず Revoke → 再発行すること**（履歴に 5 本の実キーが含まれていた） |
| **T-02** | ~~git 履歴からシークレットを除去する~~ | ✅ 完了（2026-08-14）。`git filter-repo` で除去し、GitHub から再 clone して 0 件を確認。詳細は `docs/secret-removal.md` |

### 🟠 移行の残作業

| ID | 内容 |
|---|---|
| **T-03** | ~~`_old-laravel-backend/` と `temp-laravel/` を手動削除~~ ✅ 完了 |
| **T-04** | ~~削除された PHP ファイル 157 本を git にコミット~~ ✅ 完了 |
| **T-05** | ~~ローカルで `pytest` を実行~~ ✅ 完了（101 ケース通過） |
| **T-06** | ~~`docker compose up --build` で起動確認~~ ✅ 完了 |
| **T-07** | Railway の Variables を `docs/railway-setup.md` に従って設定 ⚠️ **未完了** |
| **T-08** | **バックエンドサービスを Railway に作成し、フロントに `VITE_API_URL` を設定する** ⚠️ **未完了**。現状フロントエンドしか動いておらず API は到達不能。`VITE_API_URL` 未設定のため現行バンドルには `http://localhost:8000` が焼き込まれている |
| **T-09** | 開発実績の `duration` / `team` を実績値へ更新 |

### 🟡 機能追加

| ID | 内容 |
|---|---|
| T-10 | `ContactModal` の導線を LP に追加 |
| T-11 | 管理者ロールと問い合わせ管理画面 |
| T-12 | パスワードリセット（メール送信）フロー |
| T-13 | メールアドレス確認フロー（`email_verified_at` は用意済み） |

### 🟢 リファクタリング

| ID | 内容 |
|---|---|
| T-14 | `healthcare_lp_react_tailwind_ui.jsx` を分割 |
| T-15 | `blogData` / `featureData` / 開発実績をソースから分離（将来的には DB 化） |
| T-16 | ~~未使用コンポーネントと依存の削除~~ ✅ 完了 |
| T-17 | ~~画像の重複解消~~ ✅ 完了（`src/assets/images` と `src/components/*.png` 計 46 枚・約 80MB を削除。LP は `public/` から絶対パスで読む） |
| T-18 | `console.log` の削除 |

### 🔵 品質・運用

| ID | 内容 |
|---|---|
| T-19 | フロントエンドのテスト導入 |
| T-20 | GitHub Actions で CI |
| T-21 | レート制限を Redis 化 |
| T-22 | ~~ルートの `.md` 39本 / `.bat` 26本 を整理~~ ✅ 完了 |
| T-23 | `revoked_tokens` の定期クリーンアップ |

---

## 付録: 開発の始め方

### Docker で一括起動

```bash
docker compose up -d --build
```

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:8000 |
| API ドキュメント（Swagger） | http://localhost:8000/docs |
| メール確認（Mailpit） | http://localhost:8025 |
| pgAdmin | http://localhost:8081 |

### バックエンド単体

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -e ".[dev]"
copy .env.example .env      # DATABASE_URL 等を編集
alembic upgrade head
uvicorn app.main:app --reload
```

### フロントエンド単体

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build
npx tsc --noEmit
```

### 動作確認

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/health/ready
curl http://localhost:8000/api/test
```

---

## 付録: 実装時の注意点

1. **API を追加するとき** — `app/routers/` にルーターを作り、
   `app/schemas/` に Pydantic モデルを定義してから `main.py` で include。
   フロント側は `services/api.ts` にのみ追記（直接 fetch しない）。
2. **テーブルを追加するとき** — `app/models/` に定義し、
   `app/models/__init__.py` で必ず import（漏れると Alembic が削除差分を作る）。
   その後 `alembic revision --autogenerate`。
3. **環境変数を追加するとき** — `app/config.py` の `Settings` に
   フィールドを追加し、`.env.example` と本ドキュメントを更新。
   フロントで `VITE_` を付けた変数は**ブラウザから丸見え**です。
4. **秘密情報を扱うとき** — 必ずサーバー側の環境変数。
   コード・設定ファイル・フロントエンドには置かない。
5. **認証が必要なエンドポイント** — `CurrentUser` を依存に追加。
   課金が発生するものはレート制限も併用。
6. **開発実績を追加するとき** — `#portfolio` セクションの配列に項目を追加し、
   画像を `frontend/public/portfolio/` に置いて `imageUrl` で参照。
7. **このドキュメントを更新するとき** — 実装を変更したら該当セクションと
   「TODO一覧」の該当 ID を必ず更新してください。
