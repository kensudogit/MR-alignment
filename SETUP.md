# MR-alignment 環境設定手順

## 初回セットアップ

### 1. 環境設定ファイルの作成

#### Laravel用の.envファイル
```bash
# backend/.envファイルを作成
cd backend
cp .env.example .env
```

または、手動で`backend/.env`ファイルを作成し、以下の内容を記述：

```env
APP_NAME="MR-alignment"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=mr_alignment
DB_USERNAME=postgres
DB_PASSWORD=password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

### 2. Laravelアプリケーションキーの生成

```bash
# コンテナ内で実行
docker-compose exec backend php artisan key:generate
```

### 3. データベースマイグレーションの実行

```bash
# コンテナ内で実行
docker-compose exec backend php artisan migrate
```

### 4. 依存関係のインストール

#### バックエンド（Laravel）
```bash
# コンテナ内で実行
docker-compose exec backend composer install
```

#### フロントエンド（React + Vite）
```bash
# コンテナ内で実行
docker-compose exec frontend npm install
```

## 開発環境の起動

### 1. 全サービスの起動
```bash
start-dev.bat
```

### 2. 個別サービスの起動
```bash
# PostgreSQL
docker-compose up -d postgres

# バックエンド
docker-compose up -d backend

# フロントエンド
docker-compose up -d frontend

# pgAdmin
docker-compose up -d pgadmin
```

## アクセス先

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:8081
  - メール: admin@example.com
  - パスワード: admin

## データベース接続設定

### pgAdminでの接続設定
1. http://localhost:8081 にアクセス
2. ログイン（admin@example.com / admin）
3. 新しいサーバー接続を追加
   - 名前: MR-alignment
   - ホスト: postgres
   - ポート: 5432
   - データベース: mr_alignment
   - ユーザー名: postgres
   - パスワード: password

### 直接接続
- ホスト: localhost
- ポート: 5432
- データベース: mr_alignment
- ユーザー名: postgres
- パスワード: password

## トラブルシューティング

### よくある問題と解決方法

#### 1. アプリケーションキーが生成されていない
```bash
docker-compose exec backend php artisan key:generate
```

#### 2. データベース接続エラー
- PostgreSQLコンテナが起動しているか確認
- .envファイルの設定が正しいか確認
- ネットワーク設定を確認

#### 3. フロントエンドが表示されない
- Node.jsコンテナが起動しているか確認
- ポート3000が使用可能か確認

#### 4. ログの確認
```bash
# 全サービスのログ
docker-compose logs

# 特定サービスのログ
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```
