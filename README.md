# MR-alignment

須藤技術士事務所のランディングページと、それを支えるバックエンド API です。
（リポジトリ名は MR-alignment ですが、実体は `HealthcareLP` という LP です）

- フロントエンド: React 18 + Vite 4 + TypeScript + Tailwind CSS
- バックエンド: FastAPI（Python 3.11）+ PostgreSQL 15 + Alembic
- 認証: JWT（Bearer トークン。Cookie は使いません）

> **設計・API 一覧・DB 定義・TODO は [docs/project-memory.md](./docs/project-memory.md) が唯一の参照点です。**
> 実装や調査の前に、まずそちらを読んでください。この README は起動手順だけを扱います。

---

## 公開前に必ず行うこと

| 項目 | 内容 |
|---|---|
| 事業者情報 | `frontend/src/config/site.ts` に代表者・所在地・電話・メールを記入する。未記入だと `/legal` に「要記入」と表示され、電話の導線は出ません |
| バックエンドの URL | Vercel / Railway の環境変数に `VITE_API_URL` を設定する。**未設定だと本番ビルドは失敗します**（localhost 向けのバンドルを公開しないため） |
| OpenAI API キー | 過去に履歴へ含まれていたキーは失効させ、再発行したものを **サーバー側の環境変数にだけ** 設定する |

---

## Docker で起動する

```bash
docker compose up -d --build
```

| サービス | URL | 備考 |
|---|---|---|
| フロントエンド | http://localhost:3000 | |
| バックエンド API | http://localhost:8000 | `/docs` に OpenAPI |
| PostgreSQL | localhost:5432 | db: `mr_alignment` / user: `postgres` / pass: `password` |
| Mailpit（メール確認） | http://localhost:8025 | 送信メールはここに溜まります |
| pgAdmin | http://localhost:8081 | admin@example.com / admin |

```bash
docker compose logs -f backend   # ログ
docker compose down              # 停止
```

Windows 用のショートカットとして `docker-start.bat` / `docker-stop.bat` / `docker-logs.bat` があります。

---

## 個別に起動する

### バックエンド

```bash
cd backend
pip install -e ".[dev]"
cp .env.example .env          # DATABASE_URL などを設定
alembic upgrade head
uvicorn app.main:app --reload
```

```bash
pytest                        # 134 ケース。SQLite を使うため PostgreSQL 不要
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

```bash
npx tsc --noEmit              # 型チェック
VITE_API_URL=http://localhost:8000 npm run build
```

---

## ディレクトリ

```text
MR-alignment/
├── docs/project-memory.md   ← 設計・API・DB・TODO（唯一の参照点）
├── backend/                 FastAPI（app/ routers・services・models、migrations/、tests/）
├── frontend/                React + Vite（src/components・pages・data・config、public/）
├── database/init/           PostgreSQL 拡張の有効化のみ（テーブル定義は Alembic）
├── docker-compose.yml       postgres / backend / frontend / mailpit / pgadmin
└── Dockerfile.frontend      フロントエンド本番用（ルートの railway.json が参照）
```

---

## デプロイ

- フロントエンド: Vercel（`frontend/vercel.json` の rewrites で SPA を index.html へ寄せています）
- バックエンド: Railway（手順は [docs/railway-setup.md](./docs/railway-setup.md)）

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| 本番ビルドが `VITE_API_URL が未設定` で止まる | 意図した動作です。バックエンドのオリジン（`/api` は付けない）を環境変数に設定してください |
| フォームが「送信できませんでした」になる | バックエンドに到達できていません。`VITE_API_URL` と CORS 設定（`CORS_ORIGINS`）を確認してください |
| 認証系が「password cannot be longer than 72 bytes」で失敗する | `bcrypt` が 5.0 以降になっています。`pyproject.toml` の `bcrypt<5.0` を守ってください |
| ポートが使用中 | 3000 / 8000 / 5432 / 8025 / 8081 を使用します |
