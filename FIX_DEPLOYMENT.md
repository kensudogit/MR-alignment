# Railwayデプロイエラー修正

## 🔧 問題

ログに以下のエラーが表示されていました：
```
Container failed to start
The executable `npm` could not be found.
```

## ✅ 原因

`railway.json`の`startCommand`が`npm run preview`に設定されていましたが、最終的なDockerイメージは`nginx:alpine`で、npmは含まれていません。

## 🔨 修正内容

`railway.json`の`startCommand`を空文字列に変更しました。これにより、Dockerfileの`CMD ["nginx", "-g", "daemon off;"]`が正しく実行されます。

## 🚀 再デプロイ手順

修正を適用するには、以下を実行してください：

```bash
# 1. 変更をプッシュ（必要に応じて）
git push

# 2. Railwayに再デプロイ
railway up --detach
```

または、Railwayは自動的にGitHubの変更を検出して再デプロイする場合があります。

## ✅ 確認事項

デプロイ後、以下を確認：

1. **ログを確認**
   ```bash
   railway logs
   ```
   - nginxが正常に起動しているか確認
   - エラーメッセージがないか確認

2. **公開URLを確認**
   ```bash
   railway domain
   ```
   - URLにアクセスしてアプリケーションが表示されるか確認

3. **ヘルスチェック**
   - `https://your-domain.railway.app/health` にアクセス
   - "healthy" と表示されれば正常

## 📝 現在の設定

- ✅ Dockerfile: nginx:alpineを使用
- ✅ railway.json: startCommandを空に設定
- ✅ railway.toml: startCommandを空に設定
- ✅ nginx.conf: 正しく設定済み


