@echo off
echo ========================================
echo MR-alignment Railway デプロイスクリプト
echo ========================================
echo.

REM Railwayにログインしているか確認
echo [1/5] Railwayログイン状態を確認...
railway whoami
if %errorlevel% neq 0 (
    echo Railwayにログインしてください: railway login
    pause
    exit /b 1
)

echo.
echo [2/5] フロントエンドをビルド...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ビルドエラーが発生しました
    pause
    exit /b 1
)
cd ..

echo.
echo [3/5] Railwayプロジェクトを初期化...
echo プロジェクト名を入力してください（Enterで自動生成）:
set /p PROJECT_NAME="Project Name: "
if "%PROJECT_NAME%"=="" (
    railway init --yes
) else (
    railway init --name "%PROJECT_NAME%" --yes
)

echo.
echo [4/5] サービスを公開モードに設定...
railway variables set RAILWAY_PUBLIC_DOMAIN=1
railway variables set PUBLIC=true

echo.
echo [5/5] Railwayにデプロイ中...
railway up --detach

echo.
echo ========================================
echo デプロイ完了！
echo ========================================
echo.
echo デプロイされたURLを確認するには:
echo railway domain
echo.
echo サービスを公開するには:
echo railway service
echo.
pause


