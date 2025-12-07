@echo off
echo ========================================
echo Railwayデプロイ状態確認
echo ========================================
echo.

echo [1/4] サービスステータスを確認中...
railway status

echo.
echo [2/4] 公開ドメインを確認中...
railway domain

echo.
echo [3/4] 環境変数を確認中...
railway variables

echo.
echo [4/4] 最新のログを確認中...
railway logs --tail 10

echo.
echo ========================================
echo 確認完了
echo ========================================
echo.
echo 公開URLにアクセスして動作を確認してください:
railway domain
echo.
pause


