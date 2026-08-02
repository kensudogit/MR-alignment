# git 履歴からのシークレット除去手順（T-02）

## この作業が必要な理由

`.gitignore` への追加と `git rm --cached` は**過去のコミットからファイルを消しません**。
OpenAI API キーを含むコミットが履歴に残っており、リポジトリを clone できる人は
誰でも `git log -p` で取り出せます。

このリポジトリでは以下のコミットにキーが含まれていることを確認しています。

```
f1bd078  Fix Railway Docker build and remove API keys      frontend/.env.new
dbd8468  Add Railway Docker fix and push block resolution  frontend/.env.new
077357d  Fix Railway Docker build error                    frontend/.env.new
e66e649  (旧コミット)                                       frontend/.env.new
d732535  Remove API keys, update JavaSE-21 LTS references  frontend/.env.new, DEPLOY_NOW.md
a05a37e  (旧コミット)                                       DEPLOY_NOW.md, GIT_HISTORY_FIX.md
867ce5e  (旧コミット)                                       DEPLOY_NOW.md, GIT_HISTORY_FIX.md
63b4c57  (旧コミット)                                       DEPLOY_NOW.md
```

> リポジトリには同じ目的のスクリプトが 4 本（`REMOVE_SECRETS_FROM_HISTORY.bat`,
> `CLEAN_HISTORY_SIMPLE.bat`, `create-clean-branch.bat`, `fix-git-history.bat`）
> ありますが、いずれも完了していません。本手順に一本化してください。

---

## 手順 0（最優先・最重要）: API キーを無効化する

**履歴の書き換えより先に、これを実行してください。**

履歴を消しても、既に clone された手元のコピーや、
GitHub のキャッシュ、フォークからキーを取り出せる可能性が残ります。
**キーは既に漏洩したものとして扱ってください。**

1. https://platform.openai.com/api-keys を開く
2. 該当キーを **Revoke（無効化）**
3. 新しいキーを発行
4. 新しいキーは**サーバー側の環境変数にのみ**設定する
   - ローカル: `backend/.env` の `OPENAI_API_KEY`
   - Railway: `railway variables set OPENAI_API_KEY=sk-...`
   - Vercel（バックエンドを載せる場合）: プロジェクト設定の Environment Variables
5. **フロントエンドには絶対に設定しない**（`VITE_` 変数はビルド成果物に埋め込まれます）
6. OpenAI の Usage 画面で、身に覚えのない使用量が無いか確認する

---

## 手順 1: バックアップを取る

```bash
cd C:\devphp
git clone --mirror MR-alignment MR-alignment-backup.git
```

履歴書き換えは取り消せません。必ずバックアップを取ってください。

---

## 手順 2: 共同作業者に周知する

force push 後は、全員が clone をやり直す必要があります。
作業中のブランチがある人は、事前に patch を退避してもらってください。

```bash
# 各作業者が事前に実行
git format-patch origin/main --stdout > my-work.patch
```

---

## 手順 3: git-filter-repo を導入する

`git filter-branch` は遅く、扱いも難しいため非推奨です。

```bash
pip install git-filter-repo
```

または https://github.com/newren/git-filter-repo から `git-filter-repo`（単一ファイル）を
取得して PATH に置いてください。

---

## 手順 4: 履歴からシークレットを除去する

### 4-1. 除去対象を定義する

リポジトリの外（例: `C:\devphp\secrets.txt`）に、置換ルールを書きます。
**このファイルはリポジトリに含めないでください。**

```text
# 形式: <検索文字列>==><置換後>
# 実際のキー文字列をここに書く（旧キーは既に無効化済みである前提）
sk-proj-XXXXXXXXXXXXXXXXXXXXXXXX==>***REMOVED***
regex:sk-proj-[A-Za-z0-9_-]{20,}==>***REMOVED***
regex:sk-[A-Za-z0-9]{32,}==>***REMOVED***
```

> 実際のキー文字列は `git log -p | grep -o 'sk-[A-Za-z0-9_-]*'` で確認できます。

### 4-2. 実行する

```bash
cd C:\devphp\MR-alignment

# ファイルごと履歴から削除する
git filter-repo --force \
  --path frontend/.env.new \
  --path frontend/.env \
  --path frontend/env.production \
  --path-glob 'frontend/temp-deploy/*' \
  --path-glob 'frontend/dist/*' \
  --invert-paths

# 残った文書中のキー文字列を置換する
git filter-repo --force --replace-text C:\devphp\secrets.txt
```

---

## 手順 5: 除去できたか検証する

```bash
# 1件も出なければ成功
git log --all -p | grep -cE "sk-(proj-)?[A-Za-z0-9_-]{20,}"

# 対象ファイルが履歴から消えているか
git log --all --oneline -- frontend/.env.new
```

`0` と空の結果が返れば完了です。

---

## 手順 6: リモートへ反映する

`git filter-repo` は安全のため remote 設定を削除します。再登録してください。

```bash
git remote add origin <リポジトリURL>
git push origin --force --all
git push origin --force --tags
```

---

## 手順 7: 後始末

1. **GitHub のサポートに連絡**し、キャッシュされた古いコミットの削除を依頼する
   （フォークがある場合は特に重要）
2. **フォークがあれば削除を依頼**する（フォークは書き換えの対象外）
3. 共同作業者に clone のやり直しを依頼する

```bash
# 各作業者が実行
cd ..
rm -rf MR-alignment
git clone <リポジトリURL>
cd MR-alignment
git am < my-work.patch   # 退避した作業を戻す
```

4. ブランチを整理する（現状 `main` と `main-clean` が併存しています）

---

## 手順 8: 再発防止

### 8-1. `.gitignore` を確認する（対応済み）

```gitignore
frontend/.env
frontend/.env.*
frontend/dist/
frontend/temp-deploy/
backend/.env
```

### 8-2. pre-commit フックでシークレットを検知する

`.git/hooks/pre-commit` に以下を置き、実行権限を付けてください。

```bash
#!/bin/bash
# APIキーらしき文字列のコミットを拒否する
if git diff --cached -U0 | grep -qE '^\+.*(sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,})'; then
    echo "エラー: APIキーらしき文字列が含まれています。コミットを中止しました。" >&2
    echo "        該当箇所を確認し、環境変数へ移してください。" >&2
    exit 1
fi
```

より本格的に運用する場合は [gitleaks](https://github.com/gitleaks/gitleaks) の導入を推奨します。

### 8-3. GitHub の Secret Scanning を有効にする

リポジトリ設定 → Code security and analysis → Secret scanning を ON。
Push Protection も併せて有効にすると、コミット時点で弾けます。

---

## 不要になったスクリプト

本手順に一本化したため、以下は削除して構いません。

- `REMOVE_SECRETS_FROM_HISTORY.bat`
- `CLEAN_HISTORY_SIMPLE.bat`
- `create-clean-branch.bat`
- `fix-git-history.bat`
- `fix-commits-manually.bat`
- `remove-secrets-from-history.bat`
- `replace-api-keys.sh`
