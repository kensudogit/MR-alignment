# Railway デプロイガイド

## 🚀 完全公開モードでのデプロイ手順

### 前提条件
- Railway CLIがインストールされている（`railway --version`で確認）
- Railwayアカウントにログインしている（`railway whoami`で確認）

### デプロイ方法

#### 方法1: 自動デプロイスクリプトを使用
```bash
deploy-railway.bat
```

#### 方法2: 手動デプロイ

1. **フロントエンドをビルド**
```bash
cd frontend
npm run build
cd ..
```

2. **Railwayプロジェクトを初期化**
```bash
railway init
# プロジェクト名を入力（空白で自動生成）
```

3. **サービスを公開モードに設定**
```bash
# 公開ドメインを有効化
railway variables set RAILWAY_PUBLIC_DOMAIN=1
railway variables set PUBLIC=true

# または Railway ダッシュボードで設定:
# Settings > Network > Generate Domain を有効化
```

4. **デプロイ**
```bash
railway up
```

5. **公開URLを確認**
```bash
railway domain
```

### 完全公開モードの設定

Railwayダッシュボードで以下を設定:

1. **プロジェクト設定**
   - Settings > Network
   - "Generate Domain" を有効化
   - "Public" を有効化

2. **環境変数**
   - `RAILWAY_PUBLIC_DOMAIN=1`
   - `PUBLIC=true`

3. **サービス設定**
   - 各サービス（frontend/backend）で公開ドメインを生成
   - ポート設定を確認（frontend: 80, backend: 8000）

### フロントエンドとバックエンドの分離デプロイ

#### フロントエンドサービスのデプロイ
```bash
cd frontend
railway init --name mr-alignment-frontend
railway up
```

#### バックエンドサービスのデプロイ
```bash
cd backend
railway init --name mr-alignment-backend
railway up
```

### 環境変数の設定

#### フロントエンド
```bash
railway variables set VITE_API_URL=https://your-backend-url.railway.app
```

#### バックエンド
```bash
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false
railway variables set DB_HOST=your-db-host
railway variables set DB_DATABASE=your-db-name
railway variables set DB_USERNAME=your-db-user
railway variables set DB_PASSWORD=your-db-password
```

### トラブルシューティング

1. **デプロイが失敗する場合**
   - `railway logs` でログを確認
   - Dockerfileが正しく設定されているか確認

2. **公開URLが表示されない場合**
   - Railwayダッシュボードで Network 設定を確認
   - "Generate Domain" が有効になっているか確認

3. **サービスにアクセスできない場合**
   - ポート設定を確認（frontend: 80, backend: 8000）
   - ファイアウォール設定を確認

### 参考リンク
- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)

