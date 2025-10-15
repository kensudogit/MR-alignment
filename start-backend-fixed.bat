@echo off
echo MR Alignment Backend Server - エラー修正版
echo.

echo バックエンドサーバーを起動しています...
echo.

cd /d "%~dp0backend"

echo Laravel サーバーを起動中...
echo アクセス先: http://localhost:8000
echo API テスト: http://localhost:8000/api/test
echo ヘルスチェック: http://localhost:8000/health
echo.

php artisan serve --host=0.0.0.0 --port=8000

pause
