@echo off
echo ========================================
echo Railway APIキー設定スクリプト
echo ========================================
echo.

REM APIキーを設定（実際のAPIキーに置き換えてください）
echo 実際のOpenAI APIキーを入力してください:
set /p API_KEY="API Key: "

echo [1/2] Railwayサービスを選択してください...
railway service

echo.
echo [2/2] 環境変数を設定中...
railway variables set VITE_OPENAI_API_KEY=%API_KEY%

echo.
echo ========================================
echo APIキー設定完了！
echo ========================================
echo.
echo 設定された環境変数:
echo VITE_OPENAI_API_KEY=%API_KEY%
echo.
echo 確認するには: railway variables
echo.
pause

