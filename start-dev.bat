@echo off
echo MR-alignment 開発環境を起動しています...

echo.
echo Docker Composeでサービスを起動中...
docker-compose up -d

echo.
echo サービス起動完了！
echo.
echo アクセス先:
echo - フロントエンド: http://localhost:3000
echo - バックエンドAPI: http://localhost:8000
echo - PostgreSQL: localhost:5432echo - pgAdmin: http://localhost:8081
echo.
echo ログを確認するには: docker-compose logs -f
echo サービスを停止するには: docker-compose down
echo.
pause
