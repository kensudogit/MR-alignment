# 502エラー修正

## 🔧 実施した修正

### 1. Dockerfileの簡素化
- 複雑なポート設定を削除
- シンプルなnginx設定に戻しました
- ポート80でリッスンするように設定

### 2. Railway設定の更新
- `railway.toml`にポート80を明示的に指定
- 公開モードを有効化

## 📋 修正内容

### Dockerfile
- シンプルなnginx:alpineイメージを使用
- ポート80でリッスン
- ビルド成果物を`/usr/share/nginx/html`にコピー

### railway.toml
```toml
[network]
public = true
port = 80
```

## 🚀 再デプロイ完了

修正を適用して再デプロイしました。数分待ってから、以下を確認してください：

1. **ログを確認**
   ```bash
   railway logs --tail 20
   ```

2. **アプリケーションにアクセス**
   - https://mr-alignment-production.up.railway.app

3. **ヘルスチェック**
   - https://mr-alignment-production.up.railway.app/health

## 🔍 トラブルシューティング

### まだ502エラーが表示される場合

1. **デプロイが完了するまで待つ**（通常1-2分）
   ```bash
   railway logs --follow
   ```

2. **Railwayダッシュボードで確認**
   - https://railway.app
   - デプロイメントの状態を確認
   - エラーメッセージがないか確認

3. **ポート設定を確認**
   ```bash
   railway variables
   ```
   - `PORT`環境変数が設定されているか確認

### ビルドエラーが発生する場合

```bash
railway logs
```
でビルドログを確認してください。

## ✅ 期待される結果

- ✅ nginxが正常に起動
- ✅ ポート80でリッスン
- ✅ アプリケーションが表示される
- ✅ ヘルスチェックが正常に応答

---

**修正完了！数分待ってからアプリケーションにアクセスしてください。**


