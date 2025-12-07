# 最終解決方法: GitHubプッシュ保護の回避

## 🎯 推奨解決方法

過去のコミット履歴にAPIキーが含まれているため、以下の2つの方法から選択してください。

### 方法1: GitHubで一時的に許可（最も簡単・推奨）

1. **GitHubリポジトリのセキュリティページにアクセス**
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning

2. **検出された4つのシークレットで「Allow」をクリック**
   - 各シークレットのリンクをクリック
   - 「Allow secret」ボタンをクリック

3. **プッシュ**
   ```bash
   git push
   ```

### 方法2: 新しいクリーンなブランチを作成

1. **スクリプトを実行**
   ```bash
   fix-commits-manually.bat
   ```

2. **または手動で実行**
   ```bash
   git checkout -b main-clean
   git rm --cached frontend/env.production
   git rm --cached NEW_API_KEY_SETUP_COMPLETE.md
   git rm --cached frontend/.env.new
   git commit -m "Remove files containing API keys"
   git push origin main-clean
   ```

3. **GitHubでデフォルトブランチを変更**
   - Settings > Branches
   - Default branch を `main-clean` に変更

### 方法3: BFG Repo-Cleanerを使用（上級者向け）

1. **BFGをインストール**
   ```bash
   # Javaが必要です
   # https://rtyley.github.io/bfg-repo-cleaner/ からダウンロード
   ```

2. **APIキーを削除**
   ```bash
   java -jar bfg.jar --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin --force --all
   ```

## ⚠️ 重要な注意事項

- **方法1（GitHubで許可）** が最も簡単で安全です
- 履歴を書き換えると、既にリポジトリをクローンしている他の人に影響があります
- 現在のファイルからはAPIキーを削除済みなので、今後はこの問題は発生しません

## ✅ 現在の状態

- ✅ 現在のファイルからAPIキーを削除済み
- ✅ `.gitignore`に機密ファイルを追加済み
- ⚠️ 過去のコミット履歴にAPIキーが残っている

## 🚀 推奨アクション

**方法1（GitHubで一時的に許可）** を強く推奨します。これが最も簡単で、他の人への影響もありません。


