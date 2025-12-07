@echo off
echo ========================================
echo Git履歴からAPIキーを削除
echo ========================================
echo.
echo 警告: この操作はGit履歴を書き換えます
echo リモートにプッシュ済みの場合は force push が必要です
echo.
pause

echo.
echo [1/3] 過去のコミットからAPIキーを削除中...
echo.

REM git filter-branchを使用してAPIキーを削除
REM 注意: このコマンドは履歴を書き換えます

REM まず、問題のあるファイルを特定して修正
echo 問題のあるコミットを確認中...
git log --all --full-history --oneline -- "frontend/env.production" "NEW_API_KEY_SETUP_COMPLETE.md" "frontend/.env.new" "RAILWAY_API_KEY_SETUP.md" "SETUP_RAILWAY_ENV.md" "set-railway-api-key.bat"

echo.
echo [2/3] 履歴を書き換えるには、以下のコマンドを実行してください:
echo.
echo git filter-branch --force --index-filter ^
echo   "git rm --cached --ignore-unmatch frontend/env.production NEW_API_KEY_SETUP_COMPLETE.md frontend/.env.new RAILWAY_API_KEY_SETUP.md SETUP_RAILWAY_ENV.md set-railway-api-key.bat" ^
echo   --prune-empty --tag-name-filter cat -- --all
echo.
echo または、より安全な方法として、新しいブランチを作成して履歴を書き換えます。
echo.
echo [3/3] 推奨方法: GitHubの設定で一時的に許可
echo.
echo 1. GitHubのリポジトリページにアクセス
echo 2. Settings ^> Security ^> Secret scanning
echo 3. 検出されたシークレットの「Allow」をクリック
echo 4. その後、このスクリプトで修正したファイルをプッシュ
echo.
pause


