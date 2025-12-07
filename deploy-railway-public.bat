@echo off
echo ========================================
echo Railway完全公開モードデプロイ
echo ========================================
echo.

echo [1/4] フロントエンドをビルド中...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ビルドエラーが発生しました
    pause
    exit /b 1
)
cd ..

echo.
echo [2/4] Railwayサービスを選択してください...
echo "mr-alignment" を選択してEnterキーを押してください
railway service

echo.
echo [3/4] Railwayにデプロイ中...
railway up --detach

echo.
echo [4/4] 公開ドメインを生成中...
railway domain

echo.
echo ========================================
echo デプロイ完了！
echo ========================================
echo.
echo 公開URLを確認するには:
echo railway domain
echo.
echo Railwayダッシュボードで以下を確認:
echo 1. Settings ^> Network ^> Generate Domain が有効になっているか
echo 2. 公開ドメインが生成されているか
echo.
pause


