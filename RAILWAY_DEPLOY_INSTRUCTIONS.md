# Railway完全公開モードデプロイ手順

## 🚀 デプロイ手順

### ステップ1: フロントエンドをビルド（完了済み）

```bash
cd frontend
npm run build
cd ..
```

✅ ビルドは完了しています

### ステップ2: Railwayサービスをリンク

PowerShellまたはコマンドプロンプトで以下を実行:

```bash
cd C:\devphp\MR-alignment
railway service
```

表示されたリストから **"mr-alignment"** を選択（Enterキーを押す）

### ステップ3: Railwayにデプロイ

```bash
railway up --detach
```

### ステップ4: 公開ドメインを生成

Railwayダッシュボードで以下を設定:

1. https://railway.app にアクセス
2. プロジェクト "mr-alignment" を開く
3. サービスを選択
4. **Settings** タブを開く
5. **Network** セクションで:
   - **Generate Domain** を有効化
   - 公開ドメインが自動生成されます

または、CLIで確認:

```bash
railway domain
```

### ステップ5: 環境変数を設定（必要に応じて）

```bash
railway variables set VITE_OPENAI_API_KEY=your-openai-api-key-here
railway variables set VITE_API_URL=https://your-backend-url.railway.app
```

## 📋 完全公開モードの確認

デプロイ後、以下を確認:

1. ✅ 公開ドメインが生成されている
2. ✅ アプリケーションにアクセスできる
3. ✅ HTTPSが有効になっている

## 🔧 トラブルシューティング

### デプロイが失敗する場合

```bash
railway logs
```

でログを確認

### ドメインが表示されない場合

Railwayダッシュボードで:
- Settings > Network > Generate Domain が有効になっているか確認
- サービスが正常にデプロイされているか確認

### 環境変数が反映されない場合

```bash
railway variables
```

で環境変数を確認し、必要に応じて再設定

## 📝 現在の状態

- ✅ フロントエンドビルド完了
- ✅ Railwayプロジェクト作成済み
- ⏳ サービスリンクとデプロイが必要


