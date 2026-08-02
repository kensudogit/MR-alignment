import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  ApiUser,
  authAPI,
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
  toApiResult,
} from '../services/api';

/**
 * 認証コンテキスト。
 *
 * 旧実装は localStorage 上で認証を完結させており、
 *   - 登録ユーザーのパスワードを平文で localStorage に保存
 *   - ログイン時に平文比較（foundUser.password !== password）
 *   - トークンが 'jwt-token-' + Date.now() の擬似文字列で検証不能
 *   - 開発者ツールで isAuthenticated を書き換えるだけで認証を突破できる
 * という状態だった。
 *
 * ここではバックエンド（Laravel Sanctum）による認証へ全面的に移行し、
 * ブラウザに保持するのはサーバーが発行したトークンのみとする。
 * パスワードは一切保存しない。
 */

export interface User {
  id: number;
  name: string;
  email: string;
  organization: string | null;
  role: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  /** バリデーションエラーのフィールド別メッセージ */
  errors?: Record<string, string[]>;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  organization?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'name' | 'organization' | 'role'>>) => Promise<AuthResult>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
  ) => Promise<{ success: boolean; error?: string; errors?: Record<string, string[]> }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const toUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  organization: apiUser.organization,
  role: apiUser.role,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearSession = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // トークン失効（401）を検知したらセッションを破棄する
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // 起動時にトークンがあれば本人確認する。
  // 認証されていなくてもサイトは閲覧できるため、失敗しても画面は表示する。
  useEffect(() => {
    if (!getToken()) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    authAPI
      .me()
      .then(({ data }) => {
        if (!cancelled) {
          setUser(toUser(data.user));
        }
      })
      .catch(() => {
        // 401 はインターセプターが処理する。それ以外もセッションを破棄して続行。
        if (!cancelled) {
          clearSession();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      setToken(data.token);
      const loggedIn = toUser(data.user);
      setUser(loggedIn);
      return { success: true, user: loggedIn };
    } catch (error) {
      const result = toApiResult(error);
      return { success: false, error: result.error, errors: result.errors };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const { data } = await authAPI.register({
        name: input.name,
        email: input.email,
        password: input.password,
        password_confirmation: input.passwordConfirmation,
        organization: input.organization,
        role: input.role,
      });
      setToken(data.token);
      const registered = toUser(data.user);
      setUser(registered);
      return { success: true, user: registered };
    } catch (error) {
      const result = toApiResult(error);
      return { success: false, error: result.error, errors: result.errors };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch {
      // サーバー側の失効に失敗しても、手元のトークンは必ず破棄する
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateProfile = useCallback(
    async (data: Partial<Pick<User, 'name' | 'organization' | 'role'>>): Promise<AuthResult> => {
      setIsLoading(true);
      try {
        const response = await authAPI.updateProfile(data);
        const updated = toUser(response.data.user);
        setUser(updated);
        return { success: true, user: updated };
      } catch (error) {
        const result = toApiResult(error);
        return { success: false, error: result.error, errors: result.errors };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => {
      setIsLoading(true);
      try {
        await authAPI.changePassword({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        });
        // サーバー側で全トークンが失効するため、ローカルもログアウト状態にする
        clearSession();
        return { success: true };
      } catch (error) {
        const result = toApiResult(error);
        return { success: false, error: result.error, errors: result.errors };
      } finally {
        setIsLoading(false);
      }
    },
    [clearSession],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, isLoading, login, register, logout, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
