FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# すべての依存関係をインストール（開発用も含む）
RUN npm ci

# ソースコードをコピー
COPY . .

# ポート3000を公開
EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
