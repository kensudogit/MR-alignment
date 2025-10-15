@echo off
echo MR Alignment - エラー修正完了
echo.

echo 修正された問題:
echo 1. content.js メッセージポートエラー - ブラウザ拡張機能の競合を抑制
echo 2. 403 Forbidden エラー - バックエンドルートとCSRF設定を修正
echo.

echo 修正内容:
echo - フロントエンド: ブラウザ拡張機能エラーの抑制スクリプトを追加
echo - バックエンド: ルート設定をJSONレスポンスに変更
echo - CSRF: APIルートを除外設定に追加
echo - プロキシ: すべてのプロキシを信頼するよう設定
echo.

echo 起動方法:
echo 1. バックエンド: cd backend ^&^& php artisan serve --host=0.0.0.0 --port=8000
echo 2. フロントエンド: cd frontend ^&^& npm run dev
echo.

echo アクセス先:
echo - フロントエンド: http://localhost:3000
echo - バックエンド: http://localhost:8000
echo - ヘルスチェック: http://localhost:8000/health
echo.

echo 注意: content.jsエラーはブラウザ拡張機能によるもので、
echo アプリケーションの動作には影響しません。
echo.

pause
