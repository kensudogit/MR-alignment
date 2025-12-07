@echo off
echo ========================================
echo クリーンなブランチを作成してプッシュします
echo ========================================
echo.

REM 現在の変更をコミット
echo [1/5] 現在の変更をコミット中...
git add .
git commit -m "Fix Railway Docker build and remove API keys" || echo "変更なし、スキップ"

REM 新しいクリーンなブランチを作成
echo.
echo [2/5] クリーンなブランチを作成中...
git checkout -b main-clean

REM 機密ファイルをGitから削除（ファイル自体は残す）
echo.
echo [3/5] 機密ファイルをGitから削除中...
git rm --cached frontend/env.production 2>nul
git rm --cached frontend/.env.new 2>nul
git rm --cached NEW_API_KEY_SETUP_COMPLETE.md 2>nul

REM コミット
echo.
echo [4/5] 変更をコミット中...
git commit -m "Remove files containing API keys from Git tracking"

REM プッシュ
echo.
echo [5/5] クリーンなブランチをプッシュ中...
git push origin main-clean

echo.
echo ========================================
echo 完了！
echo ========================================
echo.
echo 次のステップ:
echo 1. GitHubで以下のURLにアクセス:
echo    https://github.com/kensudogit/MR-alignment/settings/branches
echo.
echo 2. Default branch を "main-clean" に変更
echo.
echo 3. または、GitHubのセキュリティページでシークレットを許可:
echo    https://github.com/kensudogit/MR-alignment/security/secret-scanning
echo.
pause

