import React, { useState } from 'react';
import './ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    subject: '',
    message: '',
    contactMethod: 'email',
    urgency: 'normal'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      // ここで実際のAPI呼び出しを行う
      const response = await fetch('http://localhost:8000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('お問い合わせを送信しました。担当者よりご連絡いたします。');
        setTimeout(() => {
          onClose();
          // フォームをリセット
          setFormData({
            name: '',
            email: '',
            organization: '',
            role: '',
            subject: '',
            message: '',
            contactMethod: 'email',
            urgency: 'normal'
          });
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'エラーが発生しました。再度お試しください。');
      }
    } catch (error) {
      setMessage('ネットワークエラーが発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div className="contact-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="contact-modal-close" onClick={onClose}>×</button>
        
        <div className="contact-modal-header">
          <h2>お問い合わせ</h2>
          <p>システムに関するご質問やサポートが必要な場合は、お気軽にお問い合わせください。</p>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">お名前 *</label>
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
              <label htmlFor="email">メールアドレス *</label>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="organization">所属機関</label>
              <select
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
              >
                <option value="">選択してください</option>
                <option value="hospital">病院</option>
                <option value="clinic">クリニック</option>
                <option value="pharmacy">薬局</option>
                <option value="university">大学・研究機関</option>
                <option value="company">企業</option>
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
              >
                <option value="">選択してください</option>
                <option value="doctor">医師</option>
                <option value="nurse">看護師</option>
                <option value="pharmacist">薬剤師</option>
                <option value="technician">技師</option>
                <option value="researcher">研究者</option>
                <option value="admin">管理職</option>
                <option value="other">その他</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="subject">件名 *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="システムの導入について"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">お問い合わせ内容 *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={5}
              placeholder="詳細をお聞かせください..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactMethod">ご希望の連絡方法</label>
              <select
                id="contactMethod"
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleInputChange}
              >
                <option value="email">メール</option>
                <option value="phone">電話</option>
                <option value="both">両方</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="urgency">緊急度</label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
              >
                <option value="low">低</option>
                <option value="normal">普通</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('送信しました') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? '送信中...' : '送信する'}
            </button>
          </div>
        </form>

        <div className="contact-info">
          <h3>その他の連絡方法</h3>
          <div className="contact-methods">
            <div className="contact-method">
              <span className="method-icon">📧</span>
              <div>
                <strong>メール</strong>
                <p>support@mr-alignment.com</p>
              </div>
            </div>
            <div className="contact-method">
              <span className="method-icon">📞</span>
              <div>
                <strong>電話</strong>
                <p>03-1234-5678（平日 9:00-18:00）</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
