import React, { useState } from 'react';
import './PhoneCallModal.css';

interface PhoneCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PhoneCallModal: React.FC<PhoneCallModalProps> = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  const handlePhoneCall = () => {
    if (!phoneNumber.trim()) {
      alert('電話番号を入力してください');
      return;
    }

    // 電話番号の形式をチェック
    const cleanNumber = phoneNumber.replace(/[^\d+\-\(\)\s]/g, '');
    if (cleanNumber.length < 10) {
      alert('有効な電話番号を入力してください');
      return;
    }

    console.log('📞 カスタム電話番号で発信:', cleanNumber);
    setIsCalling(true);

    try {
      // 複数の方法で電話発信を試行
      console.log('🔗 方法1: window.location.href で電話発信');
      window.location.href = `tel:${cleanNumber}`;
      
      // 方法2: window.open (バックアップ)
      setTimeout(() => {
        console.log('🔗 方法2: window.open で電話発信（バックアップ）');
        window.open(`tel:${cleanNumber}`, '_self');
      }, 100);
      
      // 方法3: リンク要素を作成してクリック
      setTimeout(() => {
        console.log('🔗 方法3: 動的リンク要素で電話発信');
        const link = document.createElement('a');
        link.href = `tel:${cleanNumber}`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 200);

      console.log('✅ カスタム電話番号での発信を実行しました');
      
      // 発信後、入力フィールドをクリアして再入力可能にする
      setTimeout(() => {
        setIsCalling(false);
        setPhoneNumber(''); // 入力フィールドをクリア
        console.log('🔄 電話番号入力フィールドをクリアしました。新しい番号を入力できます。');
      }, 2000);

    } catch (error) {
      console.error('❌ カスタム電話発信でエラーが発生:', error);
      alert(`電話発信に失敗しました。\n\nお電話でのご相談はこちらまで：\n${cleanNumber}`);
      setIsCalling(false);
    }
  };

  const handleClearNumber = () => {
    setPhoneNumber('');
    console.log('🗑️ 電話番号をクリアしました');
  };

  const handleCloseModal = () => {
    setPhoneNumber('');
    setIsCalling(false);
    onClose();
    console.log('❌ 電話発信モーダルを閉じました');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePhoneCall();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="phone-call-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📞 電話をかける</h2>
          <button className="close-button" onClick={handleCloseModal}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              電話番号を入力してください
            </label>
            <div className="input-container">
              <input
                type="tel"
                id="phoneNumber"
                className="form-input"
                placeholder="例: 03-1234-5678 または 090-1234-5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isCalling}
              />
              {phoneNumber && (
                <button 
                  className="clear-input-btn"
                  onClick={handleClearNumber}
                  disabled={isCalling}
                  title="入力内容をクリア"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <p className="form-help">
              ※ ハイフン（-）や括弧（）は自動的に処理されます
            </p>
          </div>

          <div className="quick-numbers">
            <h3 className="quick-numbers-title">よく使う番号</h3>
            <div className="quick-numbers-grid">
              <button 
                className="quick-number-btn"
                onClick={() => setPhoneNumber('03-1234-5678')}
                disabled={isCalling}
              >
                03-1234-5678
              </button>
              <button 
                className="quick-number-btn"
                onClick={() => setPhoneNumber('090-1234-5678')}
                disabled={isCalling}
              >
                090-1234-5678
              </button>
              <button 
                className="quick-number-btn"
                onClick={() => setPhoneNumber('080-1234-5678')}
                disabled={isCalling}
              >
                080-1234-5678
              </button>
              <button 
                className="quick-number-btn"
                onClick={() => setPhoneNumber('0120-123-456')}
                disabled={isCalling}
              >
                0120-123-456
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-clear" 
            onClick={handleClearNumber}
            disabled={isCalling || !phoneNumber.trim()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            クリア
          </button>
          <button 
            className="btn-cancel" 
            onClick={handleCloseModal}
            disabled={isCalling}
          >
            閉じる
          </button>
          <button 
            className="btn-call" 
            onClick={handlePhoneCall}
            disabled={isCalling || !phoneNumber.trim()}
          >
            {isCalling ? (
              <>
                <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                発信中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                電話をかける
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneCallModal;
