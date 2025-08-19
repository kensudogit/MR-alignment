import React, { useState } from 'react';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    organization: '',
    role: ''
  });

  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setMessage('');

    try {
      if (mode === 'register' && formData.password !== formData.confirmPassword) {
        setMessage('パスワードが一致しません');
        return;
      }

      // ここで実際のAPI呼び出しを行う
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(mode === 'login' ? 'ログインに成功しました！' : '登録に成功しました！');
        setTimeout(() => {
          onClose();
          // ログイン成功後の処理（例：ダッシュボードにリダイレクト）
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'エラーが発生しました');
      }
    } catch (error) {
      setMessage('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
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

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? '処理中...' : (mode === 'login' ? 'ログイン' : '登録')}
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
