# Git履歴からAPIキーを削除する方法

## ⚠️ 問題

過去のコミット（`5e6ef2e`、`05eb00b`）にAPIキーが含まれているため、GitHubのプッシュ保護に引っかかっています。

## 🔧 解決方法

### 方法1: GitHubで一時的に許可（推奨・簡単）

1. GitHubリポジトリにアクセス
2. 検出されたシークレットのリンクをクリック:
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAoU5Uq2mmMu7fFv631dkAb
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAtLWffdITGdpN7iSHrDuiD
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxqPBotbDLUawqC4sSLZooiy
   - https://github.com/kensudogit/MR-alignment/security/secret-scanning/unblock-secret/36GxAoe0xdSd5aQieqtLiyDjMq
3. 各シークレットで「Allow」をクリック
4. その後、修正したファイルをプッシュ:
   ```bash
   git push
   ```

### 方法2: Git履歴を書き換える（上級者向け）

⚠️ **警告**: この操作は履歴を書き換えます。既に他の人がクローンしている場合は問題が発生する可能性があります。

#### ステップ1: git filter-repoをインストール（推奨）

```bash
pip install git-filter-repo
```

#### ステップ2: 履歴からAPIキーを含むファイルを削除

```bash
git filter-repo --path frontend/env.production --path NEW_API_KEY_SETUP_COMPLETE.md --path frontend/.env.new --invert-paths --force
```

#### ステップ3: ファイルの内容からAPIキーを削除

```bash
# 実際のAPIキーをREMOVED_API_KEYに置き換える
# 形式: 実際のAPIキー==>REMOVED_API_KEY
git filter-repo --replace-text <(echo "sk-proj-...==>REMOVED_API_KEY") --force
```

> **注意**: `sk-proj-...` の部分を実際のAPIキーに置き換えてください。

#### ステップ4: 強制プッシュ

```bash
git push origin --force --all
git push origin --force --tags
```

### 方法3: 新しいブランチを作成（安全）

1. 新しいブランチを作成:
   ```bash
   git checkout -b main-clean
   ```

2. 問題のあるファイルを削除:
   ```bash
   git rm frontend/env.production
   git rm NEW_API_KEY_SETUP_COMPLETE.md
   git rm frontend/.env.new
   git commit -m "Remove files containing API keys"
   ```

3. 新しいブランチをプッシュ:
   ```bash
   git push origin main-clean
   ```

4. GitHubでmain-cleanをデフォルトブランチに設定

## 📝 現在の状態

- ✅ 現在のファイルからAPIキーを削除済み
- ✅ `.gitignore`に機密ファイルを追加済み
- ⚠️ 過去のコミット履歴にAPIキーが残っている

## 🎯 推奨アクション

**方法1（GitHubで一時的に許可）** を推奨します。これが最も簡単で安全です。

履歴を完全にクリーンにしたい場合は、方法2を実行してください（ただし、リポジトリをクローンしている他の人がいる場合は注意が必要です）。


