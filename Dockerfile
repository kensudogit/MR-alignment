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

# ポート80を公開
EXPOSE 80

# Nginxを起動
CMD ["nginx", "-g", "daemon off;"]

