// ローカルストレージ管理ユーティリティ

// ローカルストレージのキー定数
export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  IS_AUTHENTICATED: 'isAuthenticated',
  REGISTERED_USERS: 'registeredUsers',
  LOGIN_HISTORY: 'loginHistory',
  LOGOUT_HISTORY: 'logoutHistory',
  REGISTRATION_HISTORY: 'registrationHistory',
  PROFILE_UPDATE_HISTORY: 'profileUpdateHistory'
};

// 安全なJSONパース
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

// ローカルストレージに保存
export const setStorageItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error('Storage set error:', error);
    return false;
  }
};

// ローカルストレージから取得
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? safeJsonParse(item, defaultValue) : defaultValue;
  } catch (error) {
    console.error('Storage get error:', error);
    return defaultValue;
  }
};

// ローカルストレージから削除
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Storage remove error:', error);
    return false;
  }
};

// 認証情報をクリア
export const clearAuthData = () => {
  const keysToRemove = [
    STORAGE_KEYS.USER,
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.IS_AUTHENTICATED
  ];
  
  keysToRemove.forEach(key => removeStorageItem(key));
};

// 登録済みユーザーを取得
export const getRegisteredUsers = () => {
  return getStorageItem(STORAGE_KEYS.REGISTERED_USERS, []);
};

// 登録済みユーザーを保存
export const setRegisteredUsers = (users) => {
  return setStorageItem(STORAGE_KEYS.REGISTERED_USERS, users);
};

// ユーザーを登録済みリストに追加
export const addRegisteredUser = (userData) => {
  const users = getRegisteredUsers();
  users.push(userData);
  return setRegisteredUsers(users);
};

// メールアドレスでユーザーを検索
export const findUserByEmail = (email) => {
  const users = getRegisteredUsers();
  return users.find(user => user.email === email);
};

// ユーザーIDでユーザーを検索
export const findUserById = (id) => {
  const users = getRegisteredUsers();
  return users.find(user => user.id === id);
};

// 履歴を追加（ログイン、ログアウト、登録、プロフィール更新）
export const addToHistory = (historyKey, historyItem, maxItems = 20) => {
  const history = getStorageItem(historyKey, []);
  history.unshift(historyItem);
  
  // 最大件数を超えた場合は古いものを削除
  if (history.length > maxItems) {
    history.splice(maxItems);
  }
  
  return setStorageItem(historyKey, history);
};

// ログイン履歴を追加
export const addLoginHistory = (userId, email, ip = 'localhost') => {
  return addToHistory(STORAGE_KEYS.LOGIN_HISTORY, {
    userId,
    email,
    loginAt: new Date().toISOString(),
    ip
  }, 10);
};

// ログアウト履歴を追加
export const addLogoutHistory = (userId, email, ip = 'localhost') => {
  return addToHistory(STORAGE_KEYS.LOGOUT_HISTORY, {
    userId,
    email,
    logoutAt: new Date().toISOString(),
    ip
  }, 10);
};

// 登録履歴を追加
export const addRegistrationHistory = (userId, email, name, company, ip = 'localhost') => {
  return addToHistory(STORAGE_KEYS.REGISTRATION_HISTORY, {
    userId,
    email,
    name,
    company,
    registeredAt: new Date().toISOString(),
    ip
  }, 20);
};

// プロフィール更新履歴を追加
export const addProfileUpdateHistory = (userId, email, updatedFields, ip = 'localhost') => {
  return addToHistory(STORAGE_KEYS.PROFILE_UPDATE_HISTORY, {
    userId,
    email,
    updatedFields,
    updatedAt: new Date().toISOString(),
    ip
  }, 20);
};

// ローカルストレージの使用状況を取得
export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    const items = {};
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        items[key] = {
          size: size,
          sizeFormatted: formatBytes(size)
        };
      }
    }
    
    return {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      items,
      itemCount: Object.keys(items).length
    };
  } catch (error) {
    console.error('Storage usage error:', error);
    return null;
  }
};

// バイト数を読みやすい形式に変換
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// ローカルストレージをクリア（開発用）
export const clearAllStorage = () => {
  try {
    localStorage.clear();
    console.log('All localStorage cleared');
    return true;
  } catch (error) {
    console.error('Clear storage error:', error);
    return false;
  }
};

// デバッグ用：ローカルストレージの内容を表示
export const debugStorage = () => {
  console.log('=== LocalStorage Debug Info ===');
  console.log('Storage Usage:', getStorageUsage());
  console.log('Registered Users:', getRegisteredUsers());
  console.log('Login History:', getStorageItem(STORAGE_KEYS.LOGIN_HISTORY, []));
  console.log('Logout History:', getStorageItem(STORAGE_KEYS.LOGOUT_HISTORY, []));
  console.log('Registration History:', getStorageItem(STORAGE_KEYS.REGISTRATION_HISTORY, []));
  console.log('Profile Update History:', getStorageItem(STORAGE_KEYS.PROFILE_UPDATE_HISTORY, []));
  console.log('Current User:', getStorageItem(STORAGE_KEYS.USER));
  console.log('Token:', getStorageItem(STORAGE_KEYS.TOKEN));
  console.log('Is Authenticated:', getStorageItem(STORAGE_KEYS.IS_AUTHENTICATED));
  console.log('================================');
};
