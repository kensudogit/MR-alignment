import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getRegisteredUsers,
  setRegisteredUsers,
  findUserByEmail,
  addLoginHistory,
  addLogoutHistory,
  addRegistrationHistory,
  addProfileUpdateHistory,
  STORAGE_KEYS
} from '../utils/localStorage';

// 型定義
interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (userData: { name: string; email: string; password: string; company: string; phone: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初期化時にローカルストレージからユーザー情報を読み込み
  // 認証されていないユーザーでもサイトにアクセス可能
  useEffect(() => {
    try {
      const savedUser = getStorageItem(STORAGE_KEYS.USER);
      const savedToken = getStorageItem(STORAGE_KEYS.TOKEN);
      const isAuthenticated = getStorageItem(STORAGE_KEYS.IS_AUTHENTICATED);
      
      if (savedUser && savedToken && isAuthenticated) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
      // 認証されていない場合は何もしない（サイトは表示される）
    } catch (error) {
      console.error('Auth initialization error:', error);
      // エラーが発生してもサイトは表示される
    }
    
    // ローディング状態は即座にfalseにする（認証不要でサイトアクセス可能）
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // ローカルストレージから登録済みユーザーを検索
      const foundUser = findUserByEmail(email);
      
      if (!foundUser) {
        throw new Error('このメールアドレスは登録されていません。');
      }
      
      // パスワードの簡易チェック（実際のアプリではハッシュ化されたパスワードと比較）
      if (foundUser.password !== password) {
        throw new Error('パスワードが正しくありません。');
      }
      
      // ログイン成功時のユーザーデータ
      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        company: foundUser.company || '',
        phone: foundUser.phone || '',
        role: 'user',
        createdAt: foundUser.createdAt,
        lastLoginAt: new Date().toISOString()
      };
      
      const token = 'jwt-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      // ローカルストレージに保存
      setStorageItem(STORAGE_KEYS.USER, userData);
      setStorageItem(STORAGE_KEYS.TOKEN, token);
      setStorageItem(STORAGE_KEYS.IS_AUTHENTICATED, true);
      
      // ログイン履歴を保存
      addLoginHistory(userData.id, userData.email);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: (error as Error).message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string; company: string; phone: string }) => {
    setIsLoading(true);
    
    try {
      // 登録済みユーザーを取得
      const registeredUsers = getRegisteredUsers();
      
      // メールアドレスの重複チェック
      const existingUser = findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('このメールアドレスは既に登録されています。');
      }
      
      // 新しいユーザーIDを生成
      const newUserId = Date.now() + Math.random().toString(36).substr(2, 9);
      
      // 新規ユーザーデータを作成
      const newUser = {
        id: newUserId,
        name: userData.name,
        email: userData.email,
        password: userData.password, // 実際のアプリではハッシュ化
        company: userData.company || '',
        phone: userData.phone || '',
        role: 'user',
        createdAt: new Date().toISOString(),
        isActive: true,
        emailVerified: false
      };
      
      // 登録済みユーザーリストに追加
      registeredUsers.push(newUser);
      setRegisteredUsers(registeredUsers);
      
      // 登録履歴を保存
      addRegistrationHistory(newUserId, userData.email, userData.name, userData.company || '');
      
      // 登録完了メッセージ
      console.log('新規登録完了:', newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: (error as Error).message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // ログアウト履歴を保存
    if (user) {
      addLogoutHistory(user.id, user.email);
    }
    
    // 認証情報を削除
    removeStorageItem(STORAGE_KEYS.USER);
    removeStorageItem(STORAGE_KEYS.TOKEN);
    removeStorageItem(STORAGE_KEYS.IS_AUTHENTICATED);
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    setIsLoading(true);
    
    try {
      // 登録済みユーザーリストを更新
      const registeredUsers = getRegisteredUsers();
      const userIndex = registeredUsers.findIndex((u: any) => u.id === user.id);
      
      if (userIndex !== -1) {
        // 登録済みユーザーリストを更新
        registeredUsers[userIndex] = { ...registeredUsers[userIndex], ...updatedData };
        setRegisteredUsers(registeredUsers);
      }
      
      // 現在のユーザー情報を更新
      const updatedUser = { ...user, ...updatedData };
      
      // ローカルストレージを更新
      setStorageItem(STORAGE_KEYS.USER, updatedUser);
      setUser(updatedUser);
      
      // プロフィール更新履歴を保存
      addProfileUpdateHistory(user.id, user.email, Object.keys(updatedData));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: (error as Error).message };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
