# 🚀 Railway完全公開モードデプロイ - 今すぐ実行

## ✅ 準備完了

- ✅ フロントエンドビルド完了
- ✅ Railway設定ファイル更新済み
- ✅ Dockerfile準備済み

## 📋 デプロイ手順（3ステップ）

### ステップ1: Railwayプロジェクトをリンク

PowerShellまたはコマンドプロンプトで実行:

```bash
cd C:\devphp\MR-alignment
railway link
```

**表示されたリストから "mr-alignment" を選択（Enterキー）**

### ステップ2: サービスを選択

```bash
railway service
```

**表示されたリストから "mr-alignment" を選択（Enterキー）**

### ステップ3: デプロイ実行

```bash
railway up --detach
```

### ステップ4: 公開ドメインを確認

```bash
railway domain
```

公開URLが表示されます！

## 🌐 完全公開モードの設定

デプロイ後、Railwayダッシュボードで以下を確認:

1. https://railway.app にアクセス
2. プロジェクト "mr-alignment" を開く
3. サービスを選択
4. **Settings** タブ → **Network** セクション:
   - ✅ **Generate Domain** が有効になっているか確認
   - ✅ 公開ドメインが表示されているか確認

## 🔑 環境変数の設定（必要に応じて）

```bash
railway variables set VITE_OPENAI_API_KEY=your-openai-api-key-here
```

> **重要**: 実際のAPIキーは環境変数として設定してください。コードやドキュメントに直接記述しないでください。

## 🎯 クイックデプロイスクリプト

または、以下のスクリプトを実行:

```bash
quick-deploy.bat
```

このスクリプトは対話的な選択を案内します。

## ✅ デプロイ確認

デプロイが完了したら:

1. `railway domain` で表示されたURLにアクセス
2. アプリケーションが正常に表示されるか確認
3. HTTPSが有効になっているか確認

## 🔧 トラブルシューティング

### デプロイログを確認

```bash
railway logs
```

### 環境変数を確認

```bash
railway variables
```

### サービスステータスを確認

```bash
railway status
```

---

**準備完了！上記の手順でデプロイを開始してください。**


