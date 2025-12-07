# 🚂 Railwayデプロイガイド（バックエンド）

## 概要

LaravelバックエンドをRailwayにデプロイする手順です。

## 📋 前提条件

- Railwayアカウント（https://railway.app）
- Railway CLIがインストールされていること（オプション）
- GitHubリポジトリにコードがプッシュされていること

## 🎯 デプロイ方法

### 方法1: Railwayダッシュボードからデプロイ（推奨）

1. **Railwayにログイン**
   - https://railway.app にアクセス
   - GitHubアカウントでログイン

2. **新しいプロジェクトを作成**
   - 「New Project」をクリック
   - 「Deploy from GitHub repo」を選択
   - リポジトリ `kensudogit/MR-alignment` を選択

3. **サービスを追加**
   - 「+ New」→「GitHub Repo」を選択
   - 同じリポジトリを選択
   - Railwayが自動的に`railway.toml`を検出

4. **環境変数の設定**
   - サービスを選択
   - 「Variables」タブを開く
   - 以下の環境変数を追加（後述の「環境変数一覧」を参照）

5. **PostgreSQLデータベースの追加**（オプション）
   - 「+ New」→「Database」→「Add PostgreSQL」を選択
   - データベースの接続情報を環境変数に設定

6. **デプロイ**
   - Railwayが自動的にデプロイを開始します
   - 「Deployments」タブで進行状況を確認

### 方法2: Railway CLIからデプロイ

```bash
# Railway CLIをインストール
npm i -g @railway/cli

# Railwayにログイン
railway login

# プロジェクトをリンク
railway link

# サービスを選択（または新規作成）
railway service

# 環境変数を設定
railway variables set APP_KEY=base64:your-generated-key
railway variables set DB_CONNECTION=pgsql
railway variables set DB_HOST=your-postgres-host
railway variables set DB_PORT=5432
railway variables set DB_DATABASE=your-database
railway variables set DB_USERNAME=your-username
railway variables set DB_PASSWORD=your-password

# デプロイ
railway up --detach
```

## 🔧 環境変数の設定

### 必須環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `APP_KEY` | `base64:...` | Laravelアプリケーションキー（自動生成可） |
| `APP_ENV` | `production` | アプリケーション環境 |
| `APP_DEBUG` | `false` | デバッグモード（本番はfalse） |
| `APP_URL` | `https://your-app.railway.app` | アプリケーションURL |

### データベース環境変数（PostgreSQL使用時）

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `DB_CONNECTION` | `pgsql` | データベース接続タイプ |
| `DB_HOST` | `postgres.railway.internal` | データベースホスト（Railway PostgreSQL使用時） |
| `DB_PORT` | `5432` | データベースポート |
| `DB_DATABASE` | `railway` | データベース名 |
| `DB_USERNAME` | `postgres` | データベースユーザー名 |
| `DB_PASSWORD` | `自動生成` | データベースパスワード |

### その他の環境変数（オプション）

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `CACHE_DRIVER` | `file` | キャッシュドライバー |
| `SESSION_DRIVER` | `file` | セッションドライバー |
| `QUEUE_CONNECTION` | `sync` | キュー接続 |

### 環境変数の設定方法

#### Railwayダッシュボードから

1. プロジェクトを開く
2. サービスを選択
3. 「Variables」タブを開く
4. 「+ New Variable」をクリック
5. 変数名と値を入力
6. 「Add」をクリック

#### Railway CLIから

```bash
# 単一の環境変数を設定
railway variables set APP_KEY=base64:your-key

# 複数の環境変数を一度に設定
railway variables set APP_KEY=base64:your-key APP_ENV=production

# 環境変数を確認
railway variables

# 環境変数を削除
railway variables unset APP_KEY
```

## 🗄️ PostgreSQLデータベースの設定

### Railway PostgreSQLを追加

1. **データベースを追加**
   - 「+ New」→「Database」→「Add PostgreSQL」を選択
   - Railwayが自動的にPostgreSQLインスタンスを作成

2. **接続情報を取得**
   - データベースサービスを選択
   - 「Variables」タブで接続情報を確認：
     - `PGHOST`
     - `PGPORT`
     - `PGDATABASE`
     - `PGUSER`
     - `PGPASSWORD`

3. **バックエンドサービスに環境変数を設定**
   - バックエンドサービスを選択
   - 「Variables」タブで以下を設定：
     ```
     DB_CONNECTION=pgsql
     DB_HOST=${{Postgres.PGHOST}}
     DB_PORT=${{Postgres.PGPORT}}
     DB_DATABASE=${{Postgres.PGDATABASE}}
     DB_USERNAME=${{Postgres.PGUSER}}
     DB_PASSWORD=${{Postgres.PGPASSWORD}}
     ```
   - `${{Postgres.変数名}}` の形式でRailwayのサービス参照を使用

## 📁 プロジェクト構造

```
MR-alignment/
├── backend/              # Laravelバックエンド
│   ├── app/              # アプリケーションロジック
│   ├── config/           # 設定ファイル
│   ├── routes/           # ルート定義
│   ├── database/         # マイグレーション
│   └── docker-entrypoint.sh  # 起動スクリプト
├── Dockerfile.railway    # Railway用Dockerfile
├── railway.toml          # Railway設定ファイル
└── railway.json          # Railway設定ファイル（JSON形式）
```

## ⚙️ Railway設定ファイル

### railway.toml

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile.railway"

[deploy]
startCommand = ""
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[network]
public = true
port = 8000
```

### Dockerfile.railway

プロジェクトルートに配置されたRailway用のDockerfileです。
- ビルドコンテキストがプロジェクトルートのため、`backend/`パスを使用
- Railwayの`PORT`環境変数に対応

## 🔍 トラブルシューティング

### ビルドエラー

1. **ログの確認**
   ```bash
   railway logs
   ```

2. **Dockerfileの確認**
   - `Dockerfile.railway`が正しく配置されているか
   - パスが正しいか確認

3. **ビルドコンテキストの確認**
   - Railwayのビルドログでエラーを確認
   - `docker-entrypoint.sh`が見つからない場合はパスを確認

### 起動エラー

1. **環境変数の確認**
   ```bash
   railway variables
   ```
   - 必須の環境変数が設定されているか確認

2. **アプリケーションキーの生成**
   ```bash
   # ローカルで生成
   php artisan key:generate --show
   
   # Railwayで設定
   railway variables set APP_KEY=base64:generated-key
   ```

3. **データベース接続エラー**
   - PostgreSQLサービスの接続情報を確認
   - 環境変数が正しく設定されているか確認

### ポートエラー

- Railwayの`PORT`環境変数が自動的に設定されます
- `docker-entrypoint.sh`が`$PORT`を使用しているか確認
- `railway.toml`の`port`設定を確認

## 📊 デプロイ後の確認

1. **URLにアクセス**
   - Railwayが提供するURL（例: `https://your-app.railway.app`）
   - またはカスタムドメイン

2. **動作確認**
   - APIエンドポイントが正常に応答するか
   - データベース接続が正常か
   - ログにエラーがないか

3. **ログの確認**
   ```bash
   railway logs
   ```

## 🔄 継続的デプロイ

GitHub連携を有効にすると：
- `main`ブランチへのプッシュ → 自動デプロイ
- デプロイ履歴は「Deployments」タブで確認可能

## 📝 注意事項

- ✅ APIキーは環境変数として管理（コードに直接記述しない）
- ✅ `.env`ファイルは`.gitignore`に追加済み
- ✅ 本番環境では`APP_DEBUG=false`を設定
- ✅ データベースのバックアップを定期的に取得
- ✅ Railwayの`PORT`環境変数を使用（固定ポート8000ではなく）

## 🎉 完了

デプロイが完了すると、Railwayが提供するURLからAPIにアクセスできます！

## 📚 関連ドキュメント

- [Railway公式ドキュメント](https://docs.railway.app)
- [Laravel公式ドキュメント](https://laravel.com/docs)

