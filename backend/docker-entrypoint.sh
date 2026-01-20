#!/bin/bash

# 依存関係をインストール
if [ ! -d "vendor" ] || [ -z "$(ls -A vendor)" ]; then
    echo "Installing Laravel dependencies..."
    composer install --no-interaction --optimize-autoloader
fi

# 権限を設定
chown -R dev:dev /var/www/html
chmod -R 775 storage bootstrap/cache

# 環境設定ファイルを作成
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "APP_KEY=base64:$(openssl rand -base64 32)" > .env
fi

# アプリケーションキーを生成
if ! grep -q "APP_KEY=base64:" .env; then
    echo "Generating application key..."
    php artisan key:generate --no-interaction
fi

# データベースのマイグレーションを実行
echo "Running database migrations..."
# 既存のテーブルがある場合はエラーを無視して続行
php artisan migrate --force --no-interaction || echo "Migration completed or tables already exist"

# 開発サーバーを起動
echo "Starting Laravel development server..."
# RailwayのPORT環境変数に対応（デフォルトは8000）
PORT=${PORT:-8000}
exec php artisan serve --host=0.0.0.0 --port=$PORT
