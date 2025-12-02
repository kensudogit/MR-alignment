# Railway APIキー設定ガイド

## 🔑 APIキーの設定方法

### 方法1: Railway CLIで設定（推奨）

1. **サービスを選択**
```bash
railway service
# "mr-alignment" を選択
```

2. **環境変数を設定**
```bash
railway variables set VITE_OPENAI_API_KEY=your-openai-api-key-here
```

3. **設定を確認**
```bash
railway variables
```

### 方法2: Railwayダッシュボードで設定

1. [Railway Dashboard](https://railway.app) にアクセス
2. プロジェクト "mr-alignment" を選択
3. サービスを選択
4. "Variables" タブを開く
5. 以下の環境変数を追加:
   - **Key**: `VITE_OPENAI_API_KEY`
   - **Value**: `your-openai-api-key-here` (実際のAPIキーを入力)

### 方法3: 自動スクリプトを使用

```bash
set-railway-api-key.bat
```

## 🔒 セキュリティ注意事項

- ✅ APIキーは環境変数として管理（コードに直接記述しない）
- ✅ `.gitignore`に`env.production`を追加済み
- ✅ GitHubへのプッシュ時にシークレットスキャンで検出されないように設定済み

## 📝 必要な環境変数

Railwayで設定する環境変数:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `VITE_OPENAI_API_KEY` | `sk-proj-...` | OpenAI APIキー |
| `VITE_API_URL` | `https://...` | バックエンドAPI URL（必要に応じて） |
| `VITE_APP_ENV` | `production` | アプリケーション環境 |
| `VITE_APP_NAME` | `MR Alignment` | アプリケーション名 |

## 🚀 デプロイ後の確認

環境変数設定後、サービスを再デプロイ:

```bash
railway up
```

デプロイ後、アプリケーションでAPIキーが正しく動作するか確認してください。

