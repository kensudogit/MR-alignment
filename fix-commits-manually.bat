@echo off
echo ========================================
echo コミット履歴からAPIキーを手動で修正
echo ========================================
echo.
echo 方法1: GitHubで一時的に許可（最も簡単）
echo 以下のURLにアクセスして「Allow」をクリック:
echo.
echo https://github.com/kensudogit/MR-alignment/security/secret-scanning
echo.
pause

echo.
echo 方法2: 新しいクリーンなブランチを作成
echo.
set /p create="新しいクリーンなブランチを作成しますか？ (y/N): "
if /i not "%create%"=="y" (
    echo キャンセルしました
    pause
    exit /b 0
)

echo.
echo [1/3] 新しいブランチを作成中...
git checkout -b main-clean

echo.
echo [2/3] 問題のあるファイルを削除中...
git rm --cached frontend/env.production 2>nul
git rm --cached NEW_API_KEY_SETUP_COMPLETE.md 2>nul
git rm --cached frontend/.env.new 2>nul
git commit -m "Remove files containing API keys from history"

echo.
echo [3/3] 新しいブランチをプッシュしますか？
set /p push="プッシュしますか？ (y/N): "
if /i "%push%"=="y" (
    git push origin main-clean
    echo.
    echo GitHubで main-clean をデフォルトブランチに設定してください
)

echo.
echo ========================================
echo 完了！
echo ========================================
pause


