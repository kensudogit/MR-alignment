@echo off
echo Laravelプロジェクトをセットアップしています...

echo.
echo 1. Laravelプロジェクトを作成中...
docker run --rm -v "%cd%\backend:/var/www/html" composer:latest composer create-project laravel/laravel .

echo.
echo 2. 依存関係をインストール中...
docker run --rm -v "%cd%\backend:/var/www/html" composer:latest composer install

echo.
echo 3. 権限を設定中...
docker run --rm -v "%cd%\backend:/var/www/html" --user root composer:latest chown -R www-data:www-data /var/www/html

echo.
echo Laravelプロジェクトのセットアップが完了しました！
echo 次に start-dev.bat を実行して開発環境を起動してください。
echo.
pause
