import React, { useState, useEffect } from 'react';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // ローカルストレージから同意状況を確認
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg z-50 p-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">
            クッキーとプライバシー設定
          </h3>
          <p className="text-sm text-gray-600">
            当サイトでは、ユーザーエクスペリエンスを向上させるためにクッキーを使用しています。
            サードパーティクッキーは使用せず、必要な機能のみに限定しています。
            <a href="/privacy" className="text-blue-600 hover:underline ml-1">
              プライバシーポリシー
            </a>
            をご確認ください。
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            必要最小限のみ
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            同意する
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
