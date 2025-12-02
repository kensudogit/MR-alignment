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

# Nginx設定ファイルをテンプレートとしてコピー
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template

# RailwayのPORT環境変数に対応（デフォルトは80）
ENV PORT=80

# ポートを公開
EXPOSE $PORT

# Nginxを起動（envsubstでPORT環境変数を置換）
CMD envsubst '$$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
