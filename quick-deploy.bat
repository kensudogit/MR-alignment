@echo off
echo ========================================
echo Railway完全公開モードデプロイ（簡易版）
echo ========================================
echo.

echo [ステップ1] プロジェクトをリンク中...
echo プロジェクト一覧から "mr-alignment" を選択してください
railway link

echo.
echo [ステップ2] サービスを選択中...
echo サービス一覧から "mr-alignment" を選択してください
railway service

echo.
echo [ステップ3] デプロイ中...
railway up --detach

echo.
echo [ステップ4] 公開ドメインを確認中...
railway domain

echo.
echo ========================================
echo デプロイ完了！
echo ========================================
echo.
echo 公開URLが表示されました。
echo 公開モードが有効になっていない場合は、
echo Railwayダッシュボードで以下を設定してください:
echo.
echo 1. Settings ^> Network ^> Generate Domain を有効化
echo 2. Public を有効化
echo.
pause


