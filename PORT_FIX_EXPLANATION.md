# Railway PORT環境変数対応

## 🔧 問題

502エラーが発生していました。原因は、Railwayが動的にポートを割り当てるため、nginxが固定ポート80でリッスンしていたことです。

## ✅ 修正内容

### 1. nginx設定をテンプレート化

`frontend/nginx.conf.template`を作成し、`${PORT}`環境変数を使用するように変更：

```nginx
server {
    listen ${PORT};
    ...
}
```

### 2. Dockerfileの更新

nginx:alpineイメージには既に`envsubst`が含まれているため、起動時にPORT環境変数を置換：

```dockerfile
CMD envsubst '$$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
```

### 3. 動作の仕組み

1. Railwayが`PORT`環境変数を自動設定（例: `PORT=3000`）
2. Dockerコンテナ起動時に`envsubst`が`${PORT}`を実際のポート番号に置換
3. nginxがそのポートでリッスン
4. Railwayがそのポートにトラフィックをルーティング

## 🚀 再デプロイ

修正を適用するため、再デプロイを実行しました。

## ✅ 確認事項

デプロイ後、以下を確認：

1. **ログを確認**
   ```bash
   railway logs --tail 20
   ```
   - nginxが正常に起動しているか
   - エラーメッセージがないか

2. **アプリケーションにアクセス**
   - https://mr-alignment-production.up.railway.app

3. **ヘルスチェック**
   - https://mr-alignment-production.up.railway.app/health

## 📝 参考

- Railwayは自動的に`PORT`環境変数を設定します
- nginx:alpineイメージには`envsubst`が含まれています
- `/etc/nginx/templates/`ディレクトリのファイルは自動的に処理されます

---

**修正完了！数分待ってからアプリケーションにアクセスしてください。**


