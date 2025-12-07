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
echo [1/4] 問題のあるファイルを確認中...
git log --all --full-history --oneline -- "frontend/env.production" "NEW_API_KEY_SETUP_COMPLETE.md" "frontend/.env.new" "RAILWAY_API_KEY_SETUP.md" "SETUP_RAILWAY_ENV.md" "set-railway-api-key.bat"

echo.
echo [2/4] 問題のあるファイルを履歴から削除中...
echo.

REM 問題のあるファイルを履歴から削除
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch frontend/env.production NEW_API_KEY_SETUP_COMPLETE.md frontend/.env.new" --prune-empty --tag-name-filter cat -- --all

if %errorlevel% neq 0 (
    echo filter-branchが失敗しました。git filter-repoを使用してください。
    echo pip install git-filter-repo
    pause
    exit /b 1
)

echo.
echo [3/4] リモート参照を削除中...
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin

echo.
echo [4/4] ガベージコレクションを実行中...
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo ========================================
echo 履歴の書き換えが完了しました
echo ========================================
echo.
echo 次に、強制プッシュを実行してください:
echo git push origin --force --all
echo git push origin --force --tags
echo.
pause


