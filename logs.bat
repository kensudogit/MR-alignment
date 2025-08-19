@echo off
echo MR-alignment 開発環境のログを表示しています...

echo.
echo 全サービスのログを表示中...
echo 終了するには Ctrl+C を押してください
echo.
docker-compose logs -f

pause
