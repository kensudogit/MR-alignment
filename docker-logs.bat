@echo off
echo ========================================
echo MR-alignment Docker環境のログを表示します
echo ========================================
echo.

if "%1"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %1
)

