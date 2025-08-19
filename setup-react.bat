@echo off
echo React + Viteプロジェクトをセットアップしています...

echo.
echo 1. React + Viteプロジェクトを作成中...
docker run --rm -v "%cd%\frontend:/app" node:18-alpine sh -c "npm create vite@latest . -- --template react-ts --yes"

echo.
echo 2. 依存関係をインストール中...
docker run --rm -v "%cd%\frontend:/app" node:18-alpine sh -c "npm install"

echo.
echo 3. 権限を設定中...
docker run --rm -v "%cd%\frontend:/app" --user root node:18-alpine sh -c "chown -R node:node /app"

echo.
echo React + Viteプロジェクトのセットアップが完了しました！
echo 次に start-dev.bat を実行して開発環境を起動してください。
echo.
pause
