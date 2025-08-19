@echo off
echo MR-alignment 開発環境を停止しています...

echo.
echo Docker Composeでサービスを停止中...
docker-compose down

echo.
echo サービス停止完了！
echo.
pause
