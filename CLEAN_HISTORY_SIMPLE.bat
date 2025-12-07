@echo off
echo ========================================
echo Git履歴からAPIキーを削除（簡易版）
echo ========================================
echo.
echo 方法1: GitHubで一時的に許可（推奨・簡単）
echo.
echo 以下のURLにアクセスして、各シークレットで「Allow」をクリック:
echo.
echo 1. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAoU5Uq2mmMu7fFv631dkAb
echo 2. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAtLWffdITGdpN7iSHrDuiD
echo 3. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxqPBotbDLUawqC4sSLZooiy
echo 4. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAoe0xdSd5aQieqtLiyDjMq
echo.
echo その後、以下のコマンドでプッシュ:
echo git push
echo.
pause

echo.
echo 方法2: 履歴を書き換える（上級者向け）
echo.
echo 警告: この操作は履歴を書き換えます
echo.
set /p confirm="履歴を書き換えますか？ (y/N): "
if /i not "%confirm%"=="y" (
    echo キャンセルしました
    pause
    exit /b 0
)

echo.
echo [1/5] バックアップブランチを作成中...
git branch backup-before-cleanup

echo.
echo [2/5] 問題のあるファイルを履歴から削除中...
set FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch frontend/env.production NEW_API_KEY_SETUP_COMPLETE.md frontend/.env.new RAILWAY_API_KEY_SETUP.md SETUP_RAILWAY_ENV.md set-railway-api-key.bat" --prune-empty --tag-name-filter cat -- --all

if %errorlevel% neq 0 (
    echo エラーが発生しました
    pause
    exit /b 1
)

echo.
echo [3/5] リモート参照を削除中...
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin

echo.
echo [4/5] ガベージコレクションを実行中...
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo [5/5] 強制プッシュを実行しますか？
set /p push="強制プッシュしますか？ (y/N): "
if /i "%push%"=="y" (
    echo 強制プッシュ中...
    git push origin --force --all
    git push origin --force --tags
)

echo.
echo ========================================
echo 完了！
echo ========================================
echo.
pause


