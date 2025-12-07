# Docker環境構築ガイド

このプロジェクトはDockerを使用して開発環境を構築できます。

## 前提条件

- Docker Desktop（Windows/Mac）またはDocker Engine（Linux）がインストールされていること
- Docker Composeが利用可能であること

## クイックスタート

### 1. 環境を起動

```bash
# Windows
docker-start.bat

# Linux/Mac
docker-compose up -d --build
```

### 2. サービスにアクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **pgAdmin**: http://localhost:8081
  - Email: `admin@example.com`
  - Password: `admin`

### 3. 環境を停止

```bash
# Windows
docker-stop.bat

# Linux/Mac
docker-compose down
```

## サービス構成

### PostgreSQL
- **ポート**: 5432
- **データベース名**: `mr_alignment`
- **ユーザー名**: `postgres`
- **パスワード**: `password`

### バックエンド（Laravel）
- **ポート**: 8000
- **フレームワーク**: Laravel 10
- **PHPバージョン**: 8.2
- **自動実行**:
  - Composer依存関係のインストール
  - データベースマイグレーション
  - Laravel開発サーバーの起動

### フロントエンド（React + Vite）
- **ポート**: 3000
- **フレームワーク**: React 18 + Vite
- **自動実行**:
  - npm依存関係のインストール
  - 開発サーバーの起動

### pgAdmin
- **ポート**: 8081
- PostgreSQL管理ツール

## 便利なコマンド

### ログの確認

```bash
# すべてのサービスのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### コンテナの状態確認

```bash
docker-compose ps
```

### コンテナ内でコマンドを実行

```bash
# バックエンドコンテナでコマンド実行
docker-compose exec backend bash

# フロントエンドコンテナでコマンド実行
docker-compose exec frontend sh

# データベースに接続
docker-compose exec postgres psql -U postgres -d mr_alignment
```

### データベースのリセット

```bash
# データベースを削除して再作成
docker-compose down -v
docker-compose up -d
```

## トラブルシューティング

### ポートが既に使用されている

エラーメッセージ: `port is already allocated`

**解決方法**:
1. 使用中のポートを確認
2. `docker-compose.yml`でポート番号を変更

### コンテナが起動しない

```bash
# ログを確認
docker-compose logs

# コンテナを再ビルド
docker-compose up -d --build --force-recreate
```

### データベース接続エラー

1. PostgreSQLコンテナが起動しているか確認
   ```bash
   docker-compose ps postgres
   ```

2. データベースが準備完了になるまで待つ（初回起動時は時間がかかります）

### フロントエンドがバックエンドに接続できない

- フロントエンドの環境変数`VITE_API_URL`が正しく設定されているか確認
- Docker内では`http://backend:8000`を使用（`localhost`ではない）

## 開発時の注意点

### ホットリロード

- **フロントエンド**: ファイル変更が自動的に反映されます
- **バックエンド**: ファイル変更後、コンテナを再起動する必要があります
  ```bash
  docker-compose restart backend
  ```

### データの永続化

- PostgreSQLのデータは`postgres_data`ボリュームに保存されます
- データを完全に削除するには:
  ```bash
  docker-compose down -v
  ```

## 本番環境へのデプロイ

本番環境では、`Dockerfile.prod`を使用してください。

```bash
# バックエンド（本番用）
docker build -f backend/Dockerfile.prod -t mr-alignment-backend:prod ./backend

# フロントエンド（本番用）
docker build -f frontend/Dockerfile.prod -t mr-alignment-frontend:prod ./frontend
```

## その他のリソース

- [Docker公式ドキュメント](https://docs.docker.com/)
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)

