# 🚀 Vercelデプロイガイド

## 概要

フロントエンド（React + Vite）をVercelにデプロイする手順です。

## 📋 前提条件

- Vercelアカウント（https://vercel.com）
- GitHubリポジトリにコードがプッシュされていること

## 🎯 デプロイ方法

### 方法1: Vercelダッシュボードからデプロイ（推奨）

1. **Vercelにログイン**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン

2. **新しいプロジェクトを作成**
   - 「Add New Project」をクリック
   - GitHubリポジトリ `kensudogit/MR-alignment` を選択
   - **Root Directory** を `frontend` に設定

3. **ビルド設定**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **環境変数の設定**
   - 「Environment Variables」セクションで以下を追加：
     ```
     VITE_API_URL=https://your-backend-url.com
     VITE_APP_ENV=production
     VITE_APP_NAME=MR Alignment
     VITE_OPENAI_API_KEY=your-openai-api-key-here
     ```

5. **デプロイ**
   - 「Deploy」をクリック

### 方法2: Vercel CLIからデプロイ

```bash
# Vercel CLIをインストール
npm i -g vercel

# フロントエンドディレクトリに移動
cd frontend

# デプロイ
vercel --prod
```

初回デプロイ時は対話形式で設定を行います：
- **Set up and deploy?** → Yes
- **Which scope?** → アカウントを選択
- **Link to existing project?** → No（新規プロジェクトの場合）
- **Project name?** → `mr-alignment-frontend`（任意）
- **Directory?** → `./`
- **Override settings?** → No

### 方法3: GitHub連携（自動デプロイ）

1. **Vercelでプロジェクトを作成**（方法1の手順1-4まで）

2. **GitHub連携を有効化**
   - プロジェクト設定で「Git」を選択
   - 自動デプロイを有効化

3. **自動デプロイ**
   - `main`ブランチにプッシュすると自動的にデプロイされます

## 🔧 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-backend-url.com` | バックエンドAPI URL |
| `VITE_APP_ENV` | `production` | アプリケーション環境 |
| `VITE_APP_NAME` | `MR Alignment` | アプリケーション名 |
| `VITE_OPENAI_API_KEY` | `sk-proj-...` | OpenAI APIキー |

### 環境変数の設定方法

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Environment Variables」を選択
3. 各環境変数を追加（Production、Preview、Developmentで設定可能）

## 📁 プロジェクト構造

```
MR-alignment/
├── frontend/              # Vercelでデプロイするディレクトリ
│   ├── src/              # ソースコード
│   ├── public/           # 静的ファイル
│   ├── dist/             # ビルド出力（自動生成）
│   ├── vercel.json       # Vercel設定ファイル
│   ├── vite.config.ts     # Vite設定
│   └── package.json       # 依存関係
└── backend/              # バックエンド（別途デプロイ）
```

## ⚙️ Vercel設定ファイル

### vercel.json

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 🔍 トラブルシューティング

### ビルドエラー

1. **Node.jsバージョンの確認**
   - Vercelの設定でNode.jsバージョンを指定
   - `package.json`に`engines`フィールドを追加：
     ```json
     "engines": {
       "node": ">=18.0.0"
     }
     ```

2. **ビルドログの確認**
   - Vercelダッシュボードで「Deployments」→「View Function Logs」を確認

### 環境変数が読み込まれない

1. **変数名の確認**
   - Viteでは`VITE_`プレフィックスが必要
   - 環境変数名が正しいか確認

2. **再デプロイ**
   - 環境変数を追加/変更した後は再デプロイが必要

### ルーティングエラー（404）

- `vercel.json`の`rewrites`設定を確認
- SPA（Single Page Application）の場合はすべてのルートを`index.html`にリダイレクト

## 📊 デプロイ後の確認

1. **URLにアクセス**
   - Vercelが提供するURL（例: `https://mr-alignment-frontend.vercel.app`）

2. **動作確認**
   - ページが正常に表示されるか
   - API接続が正常に動作するか
   - 環境変数が正しく読み込まれているか

3. **カスタムドメインの設定**（オプション）
   - 「Settings」→「Domains」でカスタムドメインを追加

## 🔄 継続的デプロイ

GitHub連携を有効にすると：
- `main`ブランチへのプッシュ → 本番環境に自動デプロイ
- その他のブランチへのプッシュ → プレビュー環境に自動デプロイ

## 📝 注意事項

- ✅ APIキーは環境変数として管理（コードに直接記述しない）
- ✅ `.env`ファイルは`.gitignore`に追加済み
- ✅ 本番環境では`VITE_APP_ENV=production`を設定
- ✅ バックエンドAPIのCORS設定を確認

## 🎉 完了

デプロイが完了すると、Vercelが提供するURLからアプリケーションにアクセスできます！

