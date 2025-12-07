# 🚀 デプロイメント概要

## アーキテクチャ

- **フロントエンド**: Vercel（React + Vite）
- **バックエンド**: Railway（Laravel + PHP 8.2 + PostgreSQL）

## 📋 デプロイ手順

### 1. フロントエンド（Vercel）

詳細は `VERCEL_DEPLOYMENT_GUIDE.md` を参照

**クイックデプロイ**:
```bash
cd frontend
vercel --prod
```

**環境変数**:
- `VITE_API_URL` - バックエンドAPI URL
- `VITE_APP_ENV` - `production`
- `VITE_APP_NAME` - `MR Alignment`
- `VITE_OPENAI_API_KEY` - OpenAI APIキー

### 2. バックエンド（Railway）

詳細は `RAILWAY_DEPLOYMENT_GUIDE.md` を参照

**クイックデプロイ**:
```bash
railway-deploy-backend.bat
```

または手動で:
```bash
railway login
railway link
railway service
railway variables set APP_KEY=base64:your-key
railway variables set APP_ENV=production
railway up --detach
```

**環境変数**:
- `APP_KEY` - Laravelアプリケーションキー
- `APP_ENV` - `production`
- `APP_DEBUG` - `false`
- `DB_CONNECTION` - `pgsql`
- `DB_HOST` - PostgreSQLホスト
- `DB_PORT` - `5432`
- `DB_DATABASE` - データベース名
- `DB_USERNAME` - データベースユーザー名
- `DB_PASSWORD` - データベースパスワード

## 🔗 サービス間の連携

### フロントエンド → バックエンド

1. **バックエンドのURLを取得**
   ```bash
   railway domain
   ```

2. **Vercelで環境変数を設定**
   - `VITE_API_URL` = RailwayバックエンドのURL

### CORS設定

バックエンドの`config/cors.php`でフロントエンドのドメインを許可：

```php
'allowed_origins' => [
    'https://your-frontend.vercel.app',
],
```

## 📝 デプロイチェックリスト

### フロントエンド（Vercel）
- [ ] Vercelプロジェクトを作成
- [ ] Root Directoryを`frontend`に設定
- [ ] 環境変数を設定
- [ ] ビルドが成功するか確認
- [ ] デプロイ後のURLにアクセスして動作確認

### バックエンド（Railway）
- [ ] Railwayプロジェクトを作成
- [ ] PostgreSQLデータベースを追加
- [ ] 環境変数を設定
- [ ] デプロイが成功するか確認
- [ ] ログにエラーがないか確認
- [ ] APIエンドポイントが正常に応答するか確認

### 連携確認
- [ ] フロントエンドからバックエンドAPIに接続できるか
- [ ] CORSエラーが発生していないか
- [ ] 認証が正常に動作するか

## 🔒 セキュリティ

- ✅ APIキーは環境変数として管理
- ✅ `.env`ファイルは`.gitignore`に追加済み
- ✅ 本番環境では`APP_DEBUG=false`
- ✅ HTTPSが有効（Vercel/Railway自動対応）

## 📚 関連ドキュメント

- [Vercelデプロイガイド](./VERCEL_DEPLOYMENT_GUIDE.md)
- [Railwayデプロイガイド](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [Docker環境構築](./DOCKER_README.md)

## 🆘 トラブルシューティング

### フロントエンドがバックエンドに接続できない

1. **バックエンドのURLを確認**
   ```bash
   railway domain
   ```

2. **Vercelの環境変数を確認**
   - `VITE_API_URL`が正しく設定されているか

3. **CORS設定を確認**
   - バックエンドの`config/cors.php`でフロントエンドのドメインを許可

### バックエンドが起動しない

1. **ログを確認**
   ```bash
   railway logs
   ```

2. **環境変数を確認**
   ```bash
   railway variables
   ```

3. **データベース接続を確認**
   - PostgreSQLサービスの接続情報が正しいか

## 🎉 完了

両方のサービスがデプロイされ、正常に動作すれば完了です！

