@echo off
echo ========================================
echo Railwayバックエンドデプロイスクリプト
echo ========================================
echo.

REM Railway CLIがインストールされているか確認
railway --version >nul 2>&1
if errorlevel 1 (
    echo [エラー] Railway CLIがインストールされていません。
    echo.
    echo インストール方法:
    echo   npm install -g @railway/cli
    echo.
    pause
    exit /b 1
)

echo [1/6] Railwayにログイン中...
railway login

echo.
echo [2/6] プロジェクトをリンク中...
railway link

echo.
echo [3/6] サービスを選択してください...
railway service

echo.
echo [4/6] 環境変数を設定中...
echo.
echo アプリケーションキーを生成中...
for /f "tokens=*" %%i in ('php artisan key:generate --show 2^>nul') do set APP_KEY=%%i

if "%APP_KEY%"=="" (
    echo [警告] アプリケーションキーを自動生成できませんでした。
    echo 手動で設定してください: railway variables set APP_KEY=base64:your-key
) else (
    echo APP_KEYを設定中...
    railway variables set APP_KEY=%APP_KEY%
)

echo.
echo 基本環境変数を設定中...
railway variables set APP_ENV=production
railway variables set APP_DEBUG=false

echo.
echo [5/6] PostgreSQLデータベースの設定
echo.
set /p HAS_DB="PostgreSQLデータベースを追加しましたか？ (y/n): "
if /i "%HAS_DB%"=="y" (
    echo.
    echo データベース接続情報を設定中...
    echo 注意: Railway PostgreSQLを使用している場合、サービス参照を使用してください:
    echo   DB_CONNECTION=pgsql
    echo   DB_HOST=${{Postgres.PGHOST}}
    echo   DB_PORT=${{Postgres.PGPORT}}
    echo   DB_DATABASE=${{Postgres.PGDATABASE}}
    echo   DB_USERNAME=${{Postgres.PGUSER}}
    echo   DB_PASSWORD=${{Postgres.PGPASSWORD}}
    echo.
    echo Railwayダッシュボードで上記の環境変数を設定してください。
    pause
)

echo.
echo [6/6] デプロイを開始中...
railway up --detach

echo.
echo ========================================
echo デプロイ完了！
echo ========================================
echo.
echo 次のステップ:
echo 1. Railwayダッシュボードでデプロイ状況を確認
echo 2. 環境変数が正しく設定されているか確認
echo 3. ログを確認: railway logs
echo 4. 公開URLを確認: railway domain
echo.
pause

