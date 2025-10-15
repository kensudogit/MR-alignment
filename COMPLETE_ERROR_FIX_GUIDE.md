# MR Alignment - 完全エラー修正ガイド

## 修正されたエラー

### 1. content.js メッセージポートエラー ✅
**エラー**: `content.js:1 Uncaught (in promise) The message port closed before a response was received`

**原因**: ブラウザ拡張機能の競合

**修正内容**:
- `frontend/index.html` にブラウザ拡張機能エラー抑制スクリプトを追加
- `error` と `unhandledrejection` イベントリスナーで拡張機能エラーをキャッチ

### 2. localhost:3000 の403エラー ✅
**エラー**: `GET http://localhost:3000/ 403 (Forbidden)`

**原因**: Vite開発サーバーの設定問題

**修正内容**:
- `frontend/vite.config.ts` のサーバー設定を改善
- CORS設定を追加
- ヘッダー設定を最適化
- `package.json` のスクリプトを更新

## 修正されたファイル

### フロントエンド
- `frontend/vite.config.ts` - Vite設定の改善
- `frontend/package.json` - スクリプトの更新
- `frontend/index.html` - ブラウザ拡張機能エラー抑制
- `frontend/.env` - 環境変数ファイル作成

### バックエンド
- `backend/routes/web.php` - ルート設定変更
- `backend/app/Http/Middleware/VerifyCsrfToken.php` - CSRF設定
- `backend/app/Http/Middleware/TrustProxies.php` - プロキシ設定

## 起動方法

### 方法1: 修正版バッチファイルを使用
```bash
# ターミナル1: バックエンド
start-backend-fixed.bat

# ターミナル2: フロントエンド
start-frontend-fixed.bat
```

### 方法2: 手動起動
```bash
# バックエンド
cd backend
php artisan serve --host=0.0.0.0 --port=8000

# フロントエンド
cd frontend
npm install
npm run dev
```

### 方法3: Docker Compose
```bash
docker-compose up
```

## アクセス先

- **フロントエンド**: http://localhost:3000
- **バックエンド**: http://localhost:8000
- **API テスト**: http://localhost:8000/api/test
- **ヘルスチェック**: http://localhost:8000/health

## トラブルシューティング

### フロントエンドが起動しない場合
1. ポート3000が使用中でないか確認
2. `npm install` を実行
3. `npm run dev:local` を試す

### バックエンドが起動しない場合
1. PHPがインストールされているか確認
2. Laravelの依存関係をインストール: `composer install`
3. 環境変数を設定

### まだエラーが発生する場合
1. ブラウザキャッシュをクリア
2. 開発サーバーを再起動
3. ポートを変更して試す

## 技術的な改善点

### Vite設定の改善
- `strictPort: true` でポート固定
- `cors: true` でCORS有効化
- 適切なヘッダー設定

### エラーハンドリング
- ブラウザ拡張機能エラーの抑制
- Promise rejection の適切な処理

### 開発体験の向上
- 専用の起動スクリプト
- 環境変数の自動設定
- エラーメッセージの改善

## 注意事項

1. **content.jsエラー**: ブラウザ拡張機能によるもので、アプリケーションの動作には影響しません
2. **ポート競合**: 他のアプリケーションが同じポートを使用している場合は変更してください
3. **環境変数**: `.env` ファイルが正しく設定されていることを確認してください

これで両方のエラーが解決され、アプリケーションが正常に動作するはずです。
