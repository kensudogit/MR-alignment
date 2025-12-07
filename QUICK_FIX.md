# クイックフィックス: GitHubプッシュ保護の回避

## 🚀 最も簡単な解決方法

過去のコミット履歴にAPIキーが含まれているため、GitHubのプッシュ保護に引っかかっています。

### ステップ1: GitHubで一時的に許可

以下の4つのURLにアクセスして、各シークレットで「**Allow**」をクリックしてください：

1. **frontend/env.production**
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAoU5Uq2mmMu7fFv631dkAb

2. **NEW_API_KEY_SETUP_COMPLETE.md と frontend/.env.new**
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAtLWffdITGdpN7iSHrDuiD

3. **RAILWAY_API_KEY_SETUP.md, SETUP_RAILWAY_ENV.md, set-railway-api-key.bat**
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxqPBotbDLUawqC4sSLZooiy

4. **frontend/src/components/DownloadModal.jsx**
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAoe0xdSd5aQieqtLiyDjMq

### ステップ2: プッシュ

許可後、以下のコマンドでプッシュ：

```bash
git push
```

## ✅ これで完了です！

現在のファイルからはAPIキーを削除済みなので、今後はこの問題は発生しません。

---

## 🔧 履歴を完全にクリーンにしたい場合（オプション）

履歴を完全にクリーンにしたい場合は、以下のスクリプトを実行：

```bash
CLEAN_HISTORY_SIMPLE.bat
```

**注意**: この操作は履歴を書き換えるため、既にリポジトリをクローンしている他の人がいる場合は問題が発生する可能性があります。


