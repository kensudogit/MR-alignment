@echo off
echo MR Alignment Frontend Server - エラー修正版
echo.

echo フロントエンドサーバーを起動しています...
echo.

cd /d "%~dp0frontend"

echo 依存関係をインストール中...
call npm install

if %errorlevel% neq 0 (
    echo エラー: npm install に失敗しました
    pause
    exit /b 1
)

echo.
echo 開発サーバーを起動中...
echo アクセス先: http://localhost:3000
echo.

call npm run dev

pause
