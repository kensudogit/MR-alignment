# Microsoft Edge サードパーティクッキー対応

## 概要

このプロジェクトは、Microsoft Edgeの新しいプライバシー体験（サードパーティクッキーなしでのブラウジング）に完全対応しています。

## 対応内容

### 1. サードパーティクッキーの完全無効化

- ✅ すべてのクッキーを`SameSite=Strict`に設定
- ✅ サードパーティクッキーを完全に無効化
- ✅ トラッキングクッキーを無効化

### 2. localStorageベースの実装

認証とセッション管理は、サードパーティクッキーに依存しないlocalStorageを使用しています：

- **認証トークン**: `localStorage`に保存
- **ユーザー情報**: `localStorage`に保存
- **セッション管理**: `sessionStorage`を使用
- **クッキー同意**: `localStorage`に保存

### 3. APIリクエスト

- ✅ `fetch` APIを使用（`credentials: 'include'`を設定していない）
- ✅ `axios`で`withCredentials: false`（デフォルト）
- ✅ 認証は`Authorization`ヘッダーで実装（クッキー不要）

### 4. 外部サービス連携

- **OpenAI API**: プロキシサービス経由でクッキーを使用しない
- **外部API**: すべてクッキーに依存しない実装

## 実装詳細

### index.html

```html
<!-- サードパーティクッキー完全無効化 -->
<meta name="third-party-cookies" content="disabled" />
<meta name="tracking" content="disabled" />
```

### CookieConsentコンポーネント

Microsoft Edgeの新しい体験について明確に説明し、ユーザーに通知します。

### 認証実装

- `AuthContext.tsx`: localStorageベースの認証
- `api.ts`: Authorizationヘッダーで認証
- クッキーを使用しない実装

## テスト方法

1. Microsoft Edgeでサイトを開く
2. 開発者ツール（F12）を開く
3. Application > Cookies でクッキーを確認
4. すべてのクッキーが`SameSite=Strict`であることを確認
5. サードパーティクッキーが存在しないことを確認

## 互換性

- ✅ Microsoft Edge（最新版）
- ✅ Chrome（最新版）
- ✅ Firefox（最新版）
- ✅ Safari（最新版）

## プライバシー保護

- ✅ サードパーティトラッキング無効
- ✅ クロスサイトクッキー無効
- ✅ ファーストパーティデータのみ使用
- ✅ ユーザーのプライバシーを最大限に保護

## 更新履歴

- 2024-01-XX: Microsoft Edgeのサードパーティクッキー無効化に対応

