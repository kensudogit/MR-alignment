@echo off
echo ========================================
echo Git履歴からシークレットを削除するスクリプト
echo ========================================
echo.
echo このスクリプトは、Git履歴からAPIキーなどのシークレットを削除します。
echo.
echo 【警告】
echo - この操作はGit履歴を書き換えます
echo - 既にリポジトリをクローンしている他の人に影響があります
echo - 作業前に必ずバックアップを取ってください
echo.
pause

echo.
echo ========================================
echo 方法1: GitHubで一時的に許可（推奨・最も簡単）
echo ========================================
echo.
echo 以下のURLから各シークレットを「Allow」してください:
echo.
echo 1. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oacQQdAkbLF5hFaRFhpYY8q
echo 2. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oVoD0G9i3AM9OEXv9kkAoWH
echo 3. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oXehRdcloP2hNmDSOFJ8nOB
echo 4. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oaBiPW7j04Ngeltv9MkxILJ
echo.
echo 各URLを開いて「Allow secret」をクリックしてください。
echo その後、git push が可能になります。
echo.
pause

echo.
echo ========================================
echo 方法2: 新しいクリーンなブランチを作成
echo ========================================
echo.
set /p CREATE_CLEAN_BRANCH="新しいクリーンなブランチを作成しますか？ (y/n): "
if /i "%CREATE_CLEAN_BRANCH%"=="y" (
    echo.
    echo クリーンなブランチを作成中...
    git checkout -b main-clean
    
    echo.
    echo 機密ファイルを削除中...
    git rm --cached frontend/env.production 2>nul
    git rm --cached frontend/.env.new 2>nul
    git rm --cached NEW_API_KEY_SETUP_COMPLETE.md 2>nul
    
    echo.
    echo コミット中...
    git commit -m "Remove files containing API keys"
    
    echo.
    echo ========================================
    echo クリーンなブランチを作成しました！
    echo ========================================
    echo.
    echo 次のステップ:
    echo 1. git push origin main-clean
    echo 2. GitHubでデフォルトブランチを main-clean に変更
    echo    (Settings ^> Branches ^> Default branch)
    echo.
)

echo.
echo ========================================
echo 方法3: BFG Repo-Cleanerを使用（上級者向け）
echo ========================================
echo.
echo BFG Repo-Cleanerを使用するには:
echo 1. Javaが必要です（JavaSE-21 LTS推奨）
echo 2. https://rtyley.github.io/bfg-repo-cleaner/ からダウンロード
echo 3. passwords.txtファイルを作成してAPIキーをリスト
echo 4. 以下のコマンドを実行:
echo    java -jar bfg.jar --replace-text passwords.txt
echo    git reflog expire --expire=now --all
echo    git gc --prune=now --aggressive
echo    git push origin --force --all
echo.
echo 【注意】この方法は履歴を完全に書き換えます。
echo.

echo.
echo ========================================
echo 現在のファイルからシークレットを削除済み
echo ========================================
echo.
echo 以下のファイルは既にプレースホルダーに置き換えられています:
echo - DEPLOY_NOW.md
echo - NEW_API_KEY_SETUP_COMPLETE.md
echo - frontend/env.production
echo.
echo .gitignoreにも機密ファイルが追加済みです。
echo.
pause

