import React, { useState } from 'react';
import './DemoModal.css';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps = [
    {
      title: 'AI画像解析',
      description: 'MRI画像をアップロードしてAIによる自動解析を体験',
      image: '🔍',
      features: ['画像の自動読み込み', '異常検出アルゴリズム', '解析結果の可視化']
    },
    {
      title: 'レポート自動作成',
      description: 'AIが解析結果を基に医療レポートを自動生成',
      image: '📝',
      features: ['構造化されたレポート', '医療用語の自動補完', 'テンプレート機能']
    },
    {
      title: 'データ管理',
      description: '患者データと画像の一元管理システム',
      image: '📊',
      features: ['セキュアなデータ保存', '検索・フィルタリング', 'データエクスポート']
    },
    {
      title: 'ワークフロー最適化',
      description: '診断からレポート作成までの流れを最適化',
      image: '🔄',
      features: ['タスク管理', '承認フロー', '進捗追跡']
    }
  ];

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    playDemo();
  };

  const playDemo = () => {
    if (currentStep < demoSteps.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        if (isPlaying) {
          playDemo();
        }
      }, 3000);
    } else {
      setIsPlaying(false);
    }
  };

  const stopDemo = () => {
    setIsPlaying(false);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  if (!isOpen) return null;

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose}>×</button>
        
        <div className="demo-modal-header">
          <h2>MR-alignment デモ</h2>
          <p>システムの主要機能をご体験ください</p>
        </div>

        <div className="demo-controls">
          {!isPlaying ? (
            <button className="btn-demo-start" onClick={startDemo}>
              🚀 デモ開始
            </button>
          ) : (
            <button className="btn-demo-stop" onClick={stopDemo}>
              ⏸️ 一時停止
            </button>
          )}
          <button className="btn-demo-reset" onClick={resetDemo}>
            🔄 リセット
          </button>
        </div>

        <div className="demo-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {currentStep + 1} / {demoSteps.length}
          </span>
        </div>

        <div className="demo-content">
          <div className="demo-step">
            <div className="step-icon">{demoSteps[currentStep].image}</div>
            <h3>{demoSteps[currentStep].title}</h3>
            <p>{demoSteps[currentStep].description}</p>
            
            <div className="step-features">
              <h4>主な機能:</h4>
              <ul>
                {demoSteps[currentStep].features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="demo-navigation">
          <button 
            className="btn-nav" 
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            ← 前へ
          </button>
          
          <span className="step-indicator">
            {currentStep + 1} / {demoSteps.length}
          </span>
          
          <button 
            className="btn-nav" 
            onClick={() => setCurrentStep(prev => Math.min(demoSteps.length - 1, prev + 1))}
            disabled={currentStep === demoSteps.length - 1}
          >
            次へ →
          </button>
        </div>

        <div className="demo-footer">
          <p>実際のシステムをお試しになりたい場合は、無料トライアルにお申し込みください。</p>
          <button className="btn-trial" onClick={onClose}>
            無料トライアル開始
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
