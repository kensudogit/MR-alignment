FROM php:8.2-fpm

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd zip

# Composerをインストール
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 作業ディレクトリを設定
WORKDIR /var/www/html

# ユーザーを作成
RUN useradd -G www-data,root -u 1000 -d /home/dev dev
RUN mkdir -p /home/dev/.composer && \
    chown -R dev:dev /home/dev

# 権限を設定
RUN chown -R dev:dev /var/www/html

# 開発用の設定
RUN echo "memory_limit = 512M" > /usr/local/etc/php/conf.d/memory-limit.ini
RUN echo "upload_max_filesize = 100M" > /usr/local/etc/php/conf.d/upload-max-filesize.ini
RUN echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/upload-max-filesize.ini

# ポート8000を公開
EXPOSE 8000

# 起動スクリプトを作成
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# デフォルトコマンド
ENTRYPOINT ["docker-entrypoint.sh"]
