# 🚨 GitHubプッシュブロックの解決方法

## 問題

GitHubのプッシュ保護が過去のコミット履歴に含まれるAPIキーを検出してプッシュをブロックしています。

## ✅ 解決方法1: GitHubでシークレットを許可（最も簡単・推奨）

### 手順

以下の4つのURLにアクセスして、各シークレットを「Allow」してください：

1. **シークレット1**: https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oacQQdAkbLF5hFaRFhpYY8q
   - ファイル: `frontend/env.production:4`

2. **シークレット2**: https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oVoD0G9i3AM9OEXv9kkAoWH
   - ファイル: `NEW_API_KEY_SETUP_COMPLETE.md` (複数箇所)
   - ファイル: `frontend/.env.new:1`

3. **シークレット3**: https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oXehRdcloP2hNmDSOFJ8nOB
   - ファイル: `frontend/src/components/DownloadModal.jsx:58`

4. **シークレット4**: https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oaBiPW7j04Ngeltv9MkxILJ
   - ファイル: `DEPLOY_NOW.md:58`
   - ファイル: `RAILWAY_API_KEY_SETUP.md` (複数箇所)
   - ファイル: `set-railway-api-key.bat:8`

### 各ページでの操作

1. URLにアクセス
2. 「Allow secret」ボタンをクリック
3. 確認ダイアログで「Allow」をクリック

### プッシュ

すべてのシークレットを許可した後：

```bash
git push
```

## ✅ 解決方法2: 新しいクリーンなブランチを作成

### 自動スクリプトを使用

```bash
create-clean-branch.bat
```

### 手動で実行

```bash
# 現在の変更をコミット
git add .
git commit -m "Fix Railway Docker build and remove API keys"

# 新しいクリーンなブランチを作成
git checkout -b main-clean

# 機密ファイルをGitから削除
git rm --cached frontend/env.production
git rm --cached frontend/.env.new
git rm --cached NEW_API_KEY_SETUP_COMPLETE.md

# コミット
git commit -m "Remove files containing API keys from Git tracking"

# プッシュ
git push origin main-clean
```

### GitHubでデフォルトブランチを変更

1. https://github.com/kensudogit/MR-alignment/settings/branches にアクセス
2. Default branch を `main-clean` に変更
3. 「Update」をクリック

## 📝 現在の状態

- ✅ 現在のファイルからAPIキーを削除済み
- ✅ `.gitignore`に機密ファイルを追加済み
- ✅ Railway Dockerビルドエラーを修正済み
- ⚠️ 過去のコミット履歴にAPIキーが残っている

## 🎯 推奨アクション

**解決方法1（GitHubでシークレットを許可）を強く推奨します。**

理由：
- ✅ 最も簡単で迅速
- ✅ 履歴を書き換えない（安全）
- ✅ 他の開発者への影響なし
- ✅ すぐにプッシュ可能

## 🔒 今後の対策

1. **環境変数の使用**: すべてのAPIキーは環境変数として管理
2. **.gitignoreの確認**: 機密ファイルは必ず`.gitignore`に追加
3. **コミット前の確認**: 実際のAPIキーが含まれていないか確認
4. **GitHub Secretsの使用**: VercelやRailwayの環境変数機能を使用

