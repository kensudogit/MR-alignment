import React, { useState } from 'react';
import { contactAPI, toApiResult, type ContactPayload } from '../services/api';
import { siteInfo, hasEmail, hasPhone, telHref } from '../config/site';
import { INDUSTRY_OPTIONS, ROLE_OPTIONS, industryLabel } from '../data/industries';
import './ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    industry: '',
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
      // 共通APIクライアント経由で送信する（URLの組み立てはapi.tsに集約）
      // 業種には対応するカラムがないため、本文の先頭に載せて担当者へ伝える。
      // organization は会社・組織名、role は職種で、それぞれ contacts のカラムに入る。
      const payload: ContactPayload = {
        name: formData.name,
        email: formData.email,
        organization: formData.organization || undefined,
        role: formData.role || undefined,
        subject: formData.subject,
        message: (formData.industry
          ? `【業種】${industryLabel(formData.industry)}\n\n${formData.message}`
          : formData.message
        ).slice(0, 2000),
        contactMethod: formData.contactMethod as ContactPayload['contactMethod'],
        urgency: formData.urgency as ContactPayload['urgency'],
      };

      const { data } = await contactAPI.send(payload);

      setMessage(`${data.message}（受付番号: ${data.contact_id}）`);
      setTimeout(() => {
        onClose();
        // フォームをリセット
        setFormData({
          name: '',
          email: '',
          industry: '',
          organization: '',
          role: '',
          subject: '',
          message: '',
          contactMethod: 'email',
          urgency: 'normal'
        });
        setMessage('');
      }, 3000);
    } catch (error) {
      const result = toApiResult(error);
      const fieldMessage = result.errors
        ? Object.values(result.errors).flat()[0]
        : undefined;
      setMessage(fieldMessage || result.error || 'エラーが発生しました。再度お試しください。');
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
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="industry">業種</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
              >
                <option value="">選択してください</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organization">会社・組織名</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              placeholder="例）株式会社〇〇"
            />
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

        {/* 連絡先は config/site.ts が唯一の情報源。
            以前はここに実在しないアドレス（support@mr-alignment.com）と
            ダミーの電話番号が直書きされていた。導線がなく開かれないモーダルだったため
            気づかれていなかったが、そのまま出すと連絡が取れない案内になる。 */}
        {(hasEmail() || hasPhone()) && (
          <div className="contact-info">
            <h3>その他の連絡方法</h3>
            <div className="contact-methods">
              {hasEmail() && (
                <div className="contact-method">
                  <span className="method-icon">📧</span>
                  <div>
                    <strong>メール</strong>
                    <p>
                      <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a>
                    </p>
                  </div>
                </div>
              )}
              {hasPhone() && (
                <div className="contact-method">
                  <span className="method-icon">📞</span>
                  <div>
                    <strong>電話</strong>
                    <p>
                      <a href={telHref()}>{siteInfo.tel}</a>
                      {siteInfo.businessHours ? `（${siteInfo.businessHours}）` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
