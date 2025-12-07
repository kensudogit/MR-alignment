# Railway Dockerビルドエラー修正

## 問題

RailwayでのDockerビルド時に以下のエラーが発生していました：

```
ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref: "/docker-entrypoint.sh": not found
```

## 原因

Railwayのビルドコンテキストがプロジェクトルートになっているため、`backend/Dockerfile`を使用すると、`COPY docker-entrypoint.sh`がファイルを見つけられませんでした。

## 解決策

### 1. Railway用のDockerfileを作成

プロジェクトルートに`Dockerfile.railway`を作成し、ビルドコンテキストに合わせてパスを修正しました。

### 2. Railway設定の更新

`railway.toml`と`railway.json`を更新して、新しいDockerfileを参照するようにしました。

### 3. docker-entrypoint.shの修正

Railwayの`PORT`環境変数に対応するように修正しました。

## 変更内容

### 作成したファイル
- `Dockerfile.railway` - Railway用のDockerfile（プロジェクトルート用）

### 更新したファイル
- `railway.toml` - Dockerfileパスを`Dockerfile.railway`に変更
- `railway.json` - Dockerfileパスを`Dockerfile.railway`に変更
- `backend/docker-entrypoint.sh` - RailwayのPORT環境変数に対応

## デプロイ方法

```bash
# Railwayにデプロイ
railway up --detach
```

## 環境変数の設定

RailwayダッシュボードまたはCLIで以下の環境変数を設定：

```bash
railway variables set DB_CONNECTION=pgsql
railway variables set DB_HOST=your-postgres-host
railway variables set DB_PORT=5432
railway variables set DB_DATABASE=your-database
railway variables set DB_USERNAME=your-username
railway variables set DB_PASSWORD=your-password
```

## 確認事項

- ✅ Dockerfileのパスが正しく設定されているか
- ✅ `docker-entrypoint.sh`が正しくコピーされているか
- ✅ RailwayのPORT環境変数に対応しているか
- ✅ データベース接続設定が正しいか

## トラブルシューティング

### ビルドエラーが続く場合

1. Railwayダッシュボードでビルドログを確認
2. `railway logs`で実行時ログを確認
3. 環境変数が正しく設定されているか確認

### ポートエラーが発生する場合

Railwayの`PORT`環境変数が自動的に設定されます。`docker-entrypoint.sh`が正しく`$PORT`を使用しているか確認してください。

