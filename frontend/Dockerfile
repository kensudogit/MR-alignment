FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# 開発用依存関係もインストール
RUN npm install

# ポート3000を公開
EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
