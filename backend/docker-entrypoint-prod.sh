#!/bin/sh

# 環境設定ファイルを確認
if [ ! -f ".env" ]; then
    echo "Creating .env file from environment variables..."
    cat > .env <<EOF
APP_NAME=${APP_NAME:-Laravel}
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}

LOG_CHANNEL=${LOG_CHANNEL:-stack}
LOG_LEVEL=${LOG_LEVEL:-error}

DB_CONNECTION=${DB_CONNECTION:-pgsql}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

BROADCAST_DRIVER=${BROADCAST_DRIVER:-log}
CACHE_DRIVER=${CACHE_DRIVER:-file}
FILESYSTEM_DISK=${FILESYSTEM_DISK:-local}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-sync}
SESSION_DRIVER=${SESSION_DRIVER:-file}
SESSION_LIFETIME=${SESSION_LIFETIME:-120}
EOF
fi

# アプリケーションキーを生成（未設定の場合）
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "Generating application key..."
    php artisan key:generate --force --no-interaction
fi

# キャッシュをクリア
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 設定をキャッシュ（本番環境）
php artisan config:cache
php artisan route:cache
php artisan view:cache

# データベースのマイグレーションを実行
echo "Running database migrations..."
php artisan migrate --force --no-interaction

# 本番サーバーを起動
echo "Starting Laravel production server..."
exec php artisan serve --host=0.0.0.0 --port=8000


