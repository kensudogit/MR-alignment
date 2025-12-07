# 変更履歴

## [最新] - 2024年

### 追加
- ✅ Docker環境の完全構築
  - `docker-compose.yml` の最適化（healthcheck、サービス依存関係の改善）
  - フロントエンド `Dockerfile` の最適化
  - `docker-start.bat` - Docker環境起動スクリプト
  - `docker-stop.bat` - Docker環境停止スクリプト
  - `docker-logs.bat` - Docker環境ログ確認スクリプト
  - `DOCKER_README.md` - Docker環境詳細ガイド

### 更新
- ✅ JavaSE-21 LTS対応完了
  - `frontend/src/components/healthcare_lp_react_tailwind_ui.jsx`
    - 268行目: 「Java 17」→「JavaSE-21 LTS」
    - 297行目: 「Java等の技術」→「JavaSE-21 LTS等の技術」
    - 1051行目: 「Java 17の最新技術スタック」→「JavaSE-21 LTSの最新技術スタック」
    - 1855行目: 技術スタック配列の「Java」→「JavaSE-21 LTS」
  - `frontend/src/components/DownloadModal.jsx`
    - 104行目: 「Java、Spring Boot」→「JavaSE-21 LTS、Spring Boot」

### 改善
- ✅ `docker-compose.yml` の改善
  - PostgreSQL healthcheck追加
  - サービス間の依存関係をhealthcheckベースに変更
  - フロントエンドの環境変数最適化
  - node_modulesのボリュームマウント追加
- ✅ `README.md` の更新
  - 新しいDocker環境の情報を追加
  - JavaSE-21 LTS対応の記載を追加
  - 更新履歴セクションを追加

### 技術スタック
- **バックエンド**: PHP 8.2 + Laravel 10 + PostgreSQL 15
- **フロントエンド**: React 18 + TypeScript + Vite + Tailwind CSS
- **インフラ**: Docker + Docker Compose
- **開発教材**: JavaSE-21 LTS + Spring Boot 3.x（マイクロサービス開発）

## 以前のバージョン

詳細は各コミット履歴を参照してください。

