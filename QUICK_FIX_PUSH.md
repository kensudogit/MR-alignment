# 🚀 クイック修正: GitHubプッシュ問題の解決

## 問題
GitHubのプッシュ保護が過去のコミット履歴に含まれるAPIキーを検出してプッシュをブロックしています。

## ✅ 最も簡単な解決方法（推奨）

### ステップ1: GitHubでシークレットを許可

以下の4つのURLにアクセスして、各シークレットを「Allow」してください：

1. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oacQQdAkbLF5hFaRFhpYY8q
2. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oVoD0G9i3AM9OEXv9kkAoWH
3. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oXehRdcloP2hNmDSOFJ8nOB
4. https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oaBiPW7j04Ngeltv9MkxILJ

各ページで「Allow secret」ボタンをクリックしてください。

### ステップ2: プッシュ

```bash
git add .
git commit -m "Remove API keys from current files"
git push
```

## ✅ 完了した修正

以下のファイルからAPIキーを削除またはプレースホルダーに置き換えました：

- ✅ `DEPLOY_NOW.md` - APIキーをプレースホルダーに置き換え
- ✅ `NEW_API_KEY_SETUP_COMPLETE.md` - 既にマスク済み
- ✅ `frontend/env.production` - プレースホルダー使用
- ✅ `.gitignore` - 機密ファイルを追加
- ✅ `SECRET_REMOVAL_GUIDE.md` - APIキー例をマスク
- ✅ `GIT_HISTORY_FIX.md` - APIキー例をマスク

## 🔒 今後の対策

1. **環境変数の使用**: すべてのAPIキーは環境変数として管理
2. **.gitignoreの確認**: 機密ファイルは必ず`.gitignore`に追加
3. **コミット前の確認**: 実際のAPIキーが含まれていないか確認

## 📝 その他の方法

詳細は `SECRET_REMOVAL_GUIDE.md` を参照してください。

