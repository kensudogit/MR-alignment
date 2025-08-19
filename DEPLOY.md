# MR-alignment Vercelデプロイガイド

## 🚀 Vercelへのデプロイ手順

### 1. 前提条件
- Node.js 18以上がインストールされている
- Vercelアカウントがある
- Gitリポジトリが設定されている

### 2. Vercel CLIのインストール
```bash
npm install -g vercel
```

### 3. プロジェクトのビルド
```bash
cd frontend
npm install
npm run build
```

### 4. Vercelへのデプロイ
```bash
# プロジェクトルートで実行
vercel

# 初回デプロイ時は以下の情報を入力
# - Set up and deploy: Yes
# - Which scope: あなたのアカウントを選択
# - Link to existing project: No
# - Project name: mr-alignment
# - Directory: ./frontend
# - Override settings: No
```

### 5. 環境変数の設定
Vercelダッシュボードで以下の環境変数を設定：
```
VITE_API_URL=https://your-backend-domain.com
VITE_APP_NAME=MR-alignment
VITE_APP_VERSION=1.0.0
```

### 6. カスタムドメインの設定（オプション）
Vercelダッシュボードでカスタムドメインを設定可能

## 📁 プロジェクト構造
```
MR-alignment/
├── frontend/          # React + Viteフロントエンド
├── backend/           # Laravelバックエンド
├── vercel.json        # Vercel設定ファイル
└── DEPLOY.md          # このファイル
```

## 🔧 設定ファイル

### vercel.json
- ビルド設定
- ルーティング設定
- 環境変数設定

### vite.config.ts
- ビルド最適化
- チャンク分割
- 環境変数プレフィックス

## 🌐 アクセス方法
デプロイ後、以下のURLでアクセス可能：
- 自動生成URL: `https://mr-alignment-xxx.vercel.app`
- カスタムドメイン: 設定したドメイン

## 📱 他のPCからのアクセス
1. デプロイされたURLを他のPCのブラウザに入力
2. インターネット接続があれば世界中からアクセス可能
3. モバイルデバイスからもアクセス可能

## ⚠️ 注意事項
- バックエンドAPIは別途デプロイが必要
- 環境変数`VITE_API_URL`を正しいバックエンドURLに設定
- 本番環境では適切なセキュリティ設定を行う

## 🆘 トラブルシューティング
- ビルドエラー: `npm run build`でエラーを確認
- 環境変数: Vercelダッシュボードで設定を確認
- ドメイン: DNS設定を確認
