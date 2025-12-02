# フロントエンド用の本番Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# パッケージファイルをコピー
COPY frontend/package*.json ./

# 依存関係をインストール
RUN npm ci

# ソースコードをコピー
COPY frontend/ .

# ビルドを実行
RUN npm run build

# 本番ステージ: Nginxで静的ファイルを配信
FROM nginx:alpine

# ビルド成果物をコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx設定ファイルをコピー
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# RailwayのPORT環境変数を使用（デフォルトは80）
ENV PORT=80

# ポートを公開
EXPOSE $PORT

# Nginx設定でPORT環境変数を使用するため、envsubstで置換
RUN apk add --no-cache gettext

# 起動スクリプトを作成
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst '"'"'$$PORT'"'"' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Nginx設定ファイルをテンプレートとして配置
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template

# Nginxを起動
CMD ["/docker-entrypoint.sh"]

