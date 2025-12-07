@echo off
echo ========================================
echo MR-alignment Docker環境を起動します
echo ========================================
echo.

REM Dockerが起動しているか確認
docker info >nul 2>&1
if errorlevel 1 (
    echo [エラー] Dockerが起動していません。Docker Desktopを起動してください。
    pause
    exit /b 1
)

echo Docker環境を構築・起動中...
docker-compose up -d --build

echo.
echo ========================================
echo サービス起動完了！
echo ========================================
echo.
echo 以下のサービスが利用可能です:
echo   - フロントエンド: http://localhost:3000
echo   - バックエンドAPI: http://localhost:8000
echo   - pgAdmin: http://localhost:8081
echo     (Email: admin@example.com, Password: admin)
echo.
echo ログを確認するには: docker-compose logs -f
echo 停止するには: docker-compose down
echo.
pause

