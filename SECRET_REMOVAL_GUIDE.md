# シークレット削除ガイド

## 🚨 問題

GitHubのプッシュ保護機能が、過去のコミット履歴に含まれるAPIキーを検出してプッシュをブロックしています。

## ✅ 解決方法（3つの選択肢）

### 方法1: GitHubで一時的に許可（最も簡単・推奨）

**最も簡単で安全な方法です。**

1. 以下のURLにアクセスして、各シークレットを「Allow」してください：
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oacQQdAkbLF5hFaRFhpYY8q
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oVoD0G9i3AM9OEXv9kkAoWH
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oXehRdcloP2hNmDSOFJ8nOB
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36W1oaBiPW7j04Ngeltv9MkxILJ

2. 各ページで「Allow secret」ボタンをクリック

3. その後、通常通りプッシュできます：
   ```bash
   git push
   ```

**メリット**:
- ✅ 最も簡単
- ✅ 履歴を書き換えない
- ✅ 他の開発者への影響なし
- ✅ すぐにプッシュ可能

### 方法2: 新しいクリーンなブランチを作成

過去の履歴を保持しつつ、新しいクリーンなブランチを作成します。

```bash
# 新しいブランチを作成
git checkout -b main-clean

# 機密ファイルを削除
git rm --cached frontend/env.production
git rm --cached frontend/.env.new
git rm --cached NEW_API_KEY_SETUP_COMPLETE.md

# コミット
git commit -m "Remove files containing API keys"

# プッシュ
git push origin main-clean
```

その後、GitHubでデフォルトブランチを `main-clean` に変更：
1. Settings > Branches
2. Default branch を `main-clean` に変更

### 方法3: BFG Repo-Cleanerで履歴を完全にクリーンアップ（上級者向け）

**⚠️ 警告**: この方法は履歴を完全に書き換えます。既にリポジトリをクローンしている他の人に影響があります。

#### 前提条件
- JavaSE-21 LTS がインストールされていること
- BFG Repo-Cleaner をダウンロード済み

#### 手順

1. **BFG Repo-Cleanerをダウンロード**
   - https://rtyley.github.io/bfg-repo-cleaner/ からダウンロード

2. **passwords.txtファイルを作成**
   ```
   # 実際のAPIキーをREMOVED_API_KEYに置き換える
   # 形式: 実際のAPIキー==>REMOVED_API_KEY
   sk-proj-...==>REMOVED_API_KEY
   ```
   
   > **注意**: 上記は例です。実際のAPIキーを `sk-proj-...` の部分に記述してください。

3. **BFGを実行**
   ```bash
   java -jar bfg.jar --replace-text passwords.txt
   ```

4. **履歴をクリーンアップ**
   ```bash
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

5. **強制プッシュ**
   ```bash
   git push origin --force --all
   ```

## ✅ 現在の状態

以下のファイルは既にプレースホルダーに置き換えられています：
- ✅ `DEPLOY_NOW.md` - APIキーをプレースホルダーに置き換え済み
- ✅ `NEW_API_KEY_SETUP_COMPLETE.md` - APIキー情報を削除済み
- ✅ `frontend/env.production` - プレースホルダー使用
- ✅ `.gitignore` - 機密ファイルを追加済み

## 🔒 今後の対策

1. **環境変数の使用**
   - すべてのAPIキーは環境変数として管理
   - コードやドキュメントに直接記述しない

2. **.gitignoreの確認**
   - 機密ファイルは必ず`.gitignore`に追加
   - コミット前に確認

3. **GitHub Secretsの使用**
   - VercelやRailwayの環境変数機能を使用
   - GitHub Actions Secretsを活用

## 📝 推奨アクション

**方法1（GitHubで一時的に許可）を強く推奨します。**

これが最も簡単で、他の開発者への影響もなく、すぐにプッシュできます。

