// 認証関連のAPI関数

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 共通のリクエスト設定
const createRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
    // Microsoft Edgeのサードパーティクッキー無効化に対応
    credentials: 'same-origin', // サードパーティクッキーを使用しない
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// ログイン
export const login = async (email, password) => {
  try {
    const data = await createRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // トークンとユーザー情報をローカルストレージに保存
    if (data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { success: true, data };
  } catch (error) {
    console.error('Login API error:', error);
    return { success: false, error: error.message };
  }
};

// 新規登録
export const register = async (userData) => {
  try {
    const data = await createRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Register API error:', error);
    return { success: false, error: error.message };
  }
};

// ログアウト
export const logout = async () => {
  try {
    // サーバーサイドでのログアウト処理（必要に応じて）
    await createRequest('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // ローカルストレージからトークンとユーザー情報を削除
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// プロフィール更新
export const updateProfile = async (profileData) => {
  try {
    const data = await createRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    // 更新されたユーザー情報をローカルストレージに保存
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { success: true, data };
  } catch (error) {
    console.error('Update profile API error:', error);
    return { success: false, error: error.message };
  }
};

// パスワード変更
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const data = await createRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Change password API error:', error);
    return { success: false, error: error.message };
  }
};

// パスワードリセット要求
export const requestPasswordReset = async (email) => {
  try {
    const data = await createRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Request password reset API error:', error);
    return { success: false, error: error.message };
  }
};

// パスワードリセット実行
export const resetPassword = async (token, newPassword) => {
  try {
    const data = await createRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Reset password API error:', error);
    return { success: false, error: error.message };
  }
};

// トークン検証
export const verifyToken = async () => {
  try {
    const data = await createRequest('/auth/verify');
    return { success: true, data };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: error.message };
  }
};

// ユーザー情報取得
export const getUserProfile = async () => {
  try {
    const data = await createRequest('/auth/profile');
    return { success: true, data };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { success: false, error: error.message };
  }
};
