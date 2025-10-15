import React, { useState } from 'react';
import './AppointmentModal.css';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    department: '',
    position: '',
    preferredDate: '',
    preferredTime: '',
    consultationType: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // 模擬的な送信処理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitMessage('面談予約の申し込みを受け付けました。担当者より2営業日以内にご連絡いたします。');
      
      // フォームをリセット
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        department: '',
        position: '',
        preferredDate: '',
        preferredTime: '',
        consultationType: '',
        message: ''
      });
      
    } catch (error) {
      setSubmitMessage('申し訳ございません。エラーが発生しました。しばらく時間をおいてから再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="appointment-modal-overlay" onClick={onClose}>
      <div className="appointment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="appointment-modal-header">
          <h2 className="appointment-modal-title">面談予約</h2>
          <button className="appointment-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="appointment-modal-body">
          <p className="appointment-description">
            専門のITコンサルタントとの面談を予約いただけます。<br />
            お客様のご要望に応じて、最適なソリューションをご提案いたします。
          </p>
          
          <form onSubmit={handleSubmit} className="appointment-form">
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
                  className="form-input"
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
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">電話番号 *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="company">会社名 *</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">部署</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="position">役職</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="consultationType">相談内容 *</label>
                <select
                  id="consultationType"
                  name="consultationType"
                  value={formData.consultationType}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">選択してください</option>
                  <option value="system-development">システム開発</option>
                  <option value="digital-transformation">デジタル変革</option>
                  <option value="cloud-migration">クラウド移行</option>
                  <option value="security">セキュリティ対策</option>
                  <option value="data-analysis">データ分析</option>
                  <option value="it-strategy">IT戦略</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="preferredDate">希望日 *</label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="preferredTime">希望時間 *</label>
              <select
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">選択してください</option>
                <option value="09:00-10:00">09:00-10:00</option>
                <option value="10:00-11:00">10:00-11:00</option>
                <option value="11:00-12:00">11:00-12:00</option>
                <option value="13:00-14:00">13:00-14:00</option>
                <option value="14:00-15:00">14:00-15:00</option>
                <option value="15:00-16:00">15:00-16:00</option>
                <option value="16:00-17:00">16:00-17:00</option>
                <option value="17:00-18:00">17:00-18:00</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="message">ご要望・ご質問</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="form-input"
                placeholder="面談でお聞きになりたい内容やご要望をお聞かせください"
              />
            </div>
            
            {submitMessage && (
              <div className={`submit-message ${submitMessage.includes('受け付けました') ? 'success' : 'error'}`}>
                {submitMessage}
              </div>
            )}
            
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancel"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-submit"
              >
                {isSubmitting ? '送信中...' : '予約申し込み'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
