/**
 * 旧クライアントサイド認証が localStorage に残したデータを削除する。
 *
 * 旧実装は registeredUsers に「メールアドレスとパスワードの平文」を保存していた。
 * バックエンド認証へ移行しても、既存利用者のブラウザにはそのデータが残り続けるため、
 * アプリ起動時に確実に消す。
 *
 * この処理は数バージョン運用した後に削除してよい。
 */

const LEGACY_KEYS = [
  'registeredUsers', // ★パスワード平文を含んでいた
  'user',
  'token',
  'isAuthenticated',
  'loginHistory',
  'logoutHistory',
  'registrationHistory',
  'profileUpdateHistory',
];

export const cleanupLegacyAuthStorage = (): void => {
  try {
    for (const key of LEGACY_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // プライベートブラウジング等で localStorage が使えなくても処理を続行する
  }
};
