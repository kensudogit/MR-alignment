@echo off
echo Vercelデプロイを開始します...

echo.
echo 1. 依存関係をインストール中...
call npm install

echo.
echo 2. ビルド中...
call npm run build

echo.
echo 3. Vercelにデプロイ中...
call vercel --prod

echo.
echo デプロイが完了しました！
pause
