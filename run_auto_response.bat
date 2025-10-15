@echo off
chcp 65001 > nul
echo ========================================
echo 自動認識・自動応答システム
echo ========================================
echo.

echo 必要なライブラリをインストール中...
pip install -r requirements_auto_response.txt

echo.
echo システムを起動中...
echo 終了するには Ctrl+C を押してください
echo.

python auto_response_system.py

pause
