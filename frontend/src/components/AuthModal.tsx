import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const auth = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    organization: '',
    role: ''
  });

  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      if (mode === 'register' && formData.password !== formData.confirmPassword) {
        setMessage('パスワードが一致しません');
        return;
      }

      let result;
      if (mode === 'login') {
        result = await auth.login(formData.email, formData.password);
      } else {
        result = await auth.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          passwordConfirmation: formData.confirmPassword,
          organization: formData.organization,
          role: formData.role
        });
      }

      if (result.success) {
        setMessage(mode === 'login' ? 'ログインに成功しました！' : '登録に成功しました！');
        setTimeout(() => {
          onClose();
          // フォームをリセット
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            organization: '',
            role: ''
          });
        }, 2000);
      } else {
        // バリデーションエラーはフィールドごとのメッセージを優先して表示する
        const fieldMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : undefined;
        setMessage(fieldMessage || result.error || 'エラーが発生しました');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setMessage('ネットワークエラーが発生しました');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>{mode === 'login' ? 'ログイン' : '新規登録'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="name">お名前</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="山田 太郎"
                />
              </div>

              <div className="form-group">
                <label htmlFor="organization">所属機関</label>
                <select
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">選択してください</option>
                  <option value="hospital">病院</option>
                  <option value="clinic">クリニック</option>
                  <option value="pharmacy">薬局</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="role">職位</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">選択してください</option>
                  <option value="doctor">医師</option>
                  <option value="nurse">看護師</option>
                  <option value="pharmacist">薬剤師</option>
                  <option value="technician">技師</option>
                  <option value="admin">管理職</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="example@mr-alignment.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="8文字以上で入力"
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">パスワード（確認）</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="パスワードを再入力"
              />
            </div>
          )}

          {message && (
            <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={auth.isLoading}>
            {auth.isLoading ? '処理中...' : (mode === 'login' ? 'ログイン' : '登録')}
          </button>
        </form>

        <div className="modal-footer">
          {mode === 'login' ? (
            <p>
              アカウントをお持ちでない方は
              <button className="link-button" onClick={() => window.location.reload()}>
                新規登録
              </button>
            </p>
          ) : (
            <p>
              既にアカウントをお持ちの方は
              <button className="link-button" onClick={() => window.location.reload()}>
                ログイン
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
