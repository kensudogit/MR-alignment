import React, { useState, useRef, useEffect } from 'react';
import { buildChatPrompt, generateText } from '../services/aiContent';
import './ChatModal.css';

/** バックエンドに接続できないときの定型応答 */
const FALLBACK_RESPONSES = [
  'ご質問ありがとうございます。詳細なご相談内容をお聞かせいただけますでしょうか？',
  '承知いたしました。お客様のご要望に応じて、最適なソリューションをご提案いたします。',
  'ITサービスに関するご質問ですね。どのような分野についてお聞きになりたいでしょうか？',
  'システム導入についてのご相談ですね。まずは現状の課題をお教えください。',
  'ありがとうございます。お客様のご要望を整理して、具体的な提案をさせていただきます。',
];

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'こんにちは！須藤技術士事務所のサポートです。ご不明な点やご質問がございましたら、お気軽にお聞かせください。',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 応答生成はバックエンド経由。フロントエンドは API キーを保持しない。
      const result = await generateText(buildChatPrompt(userMessage.text));

      const text = result.success && result.content
        ? result.content
        : FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text,
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('チャットエラー:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: '申し訳ございません。現在システムに問題が発生しております。しばらく時間をおいてから再度お試しください。',
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <h3 className="chat-modal-title">サポートチャット</h3>
          <button className="chat-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.isUser ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="chat-message bot-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力してください..."
            className="chat-input"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="chat-send-button"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
