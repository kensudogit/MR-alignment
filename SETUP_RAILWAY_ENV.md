# Railway環境変数設定手順

## 🚀 クイックセットアップ

### ステップ1: Railwayサービスを選択

PowerShellまたはコマンドプロンプトで以下を実行:

```bash
cd C:\devphp\MR-alignment
railway service
```

表示されたリストから **"mr-alignment"** を選択（Enterキーを押す）

### ステップ2: APIキーを環境変数として設定

サービス選択後、以下のコマンドを実行（`your-openai-api-key-here`を実際のAPIキーに置き換えてください）:

```bash
railway variables set VITE_OPENAI_API_KEY=your-openai-api-key-here
```

### ステップ3: 設定を確認

```bash
railway variables
```

### ステップ4: 再デプロイ（必要に応じて）

```bash
railway up
```

## 🌐 Railwayダッシュボードでの設定（代替方法）

1. https://railway.app にアクセス
2. プロジェクト "mr-alignment" を開く
3. サービスを選択
4. "Variables" タブをクリック
5. "New Variable" をクリック
6. 以下を入力:
   - **Name**: `VITE_OPENAI_API_KEY`
   - **Value**: `your-openai-api-key-here` (実際のAPIキーを入力)
7. "Add" をクリック

## ✅ 完了確認

環境変数設定後、Railwayが自動的に再デプロイします。
デプロイが完了したら、公開URLでアプリケーションが正常に動作することを確認してください。

公開URLの確認:
```bash
railway domain
```

