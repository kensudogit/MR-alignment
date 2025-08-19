import { useState, useEffect } from 'react'
import AuthModal from './components/AuthModal'
import DemoModal from './components/DemoModal'
import ContactModal from './components/ContactModal'
import AIImageModal from './components/AIImageModal'
import ReportModal from './components/ReportModal'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  // モーダルの状態管理
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  })
  const [demoModal, setDemoModal] = useState(false)
  const [contactModal, setContactModal] = useState(false)
  const [aiImageModal, setAiImageModal] = useState(false)
  const [reportModal, setReportModal] = useState(false)
  const [dataManagementModal, setDataManagementModal] = useState(false)
  const [workflowModal, setWorkflowModal] = useState(false)
  const [mobileModal, setMobileModal] = useState(false)
  const [securityModal, setSecurityModal] = useState(false)

  const testApi = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/test')
      const data = await response.json()
      setMessage(data.message || 'API接続成功！')
    } catch (error) {
      setMessage('API接続エラー: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'login' })
  }

  const openDemoModal = () => {
    setDemoModal(true)
  }

  const closeDemoModal = () => {
    setDemoModal(false)
  }

  const openContactModal = () => {
    setContactModal(true)
  }

  const closeContactModal = () => {
    setContactModal(false)
  }

  const openAiImageModal = () => {
    setAiImageModal(true)
  }

  const closeAiImageModal = () => {
    setAiImageModal(false)
  }

  const openReportModal = () => {
    setReportModal(true)
  }

  const closeReportModal = () => {
    setReportModal(false)
  }

  const openDataManagementModal = () => {
    setDataManagementModal(true)
  }

  const closeDataManagementModal = () => {
    setDataManagementModal(false)
  }

  const openWorkflowModal = () => {
    setWorkflowModal(true)
  }

  const closeWorkflowModal = () => {
    setWorkflowModal(false)
  }

  const openMobileModal = () => {
    setMobileModal(true)
  }

  const closeMobileModal = () => {
    setMobileModal(false)
  }

  const openSecurityModal = () => {
    setSecurityModal(true)
  }

  const closeSecurityModal = () => {
    setSecurityModal(false)
  }

  return (
    <div className="App">
      {/* ヘッダー */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">MR</div>
            <span className="logo-text">MR-alignment</span>
          </div>
          <nav className="nav">
            <a href="#dashboard">ダッシュボード</a>
            <a href="#patients">患者管理</a>
            <a href="#reports">レポート</a>
            <a href="#settings">設定</a>
            <a href="#help">ヘルプ</a>
          </nav>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => openAuthModal('register')}>
              新規登録
            </button>
            <button className="btn-primary" onClick={() => openAuthModal('login')}>
              ログイン
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* 左側のメインコンテンツ */}
          <div className="main-section">
            {/* ヒーローセクション */}
            <section className="hero-section">
              <div className="hero-content">
                <h1 className="hero-title">今日から、MR-alignmentで!</h1>
                <p className="hero-subtitle">医療画像解析とレポート作成を効率化するAI搭載システム</p>
                <div className="hero-actions">
                  <button className="btn-hero-primary" onClick={() => openAuthModal('register')}>
                    無料トライアル開始
                  </button>
                  <button className="btn-hero-secondary" onClick={openDemoModal}>
                    デモを見る
                  </button>
                </div>
              </div>
              <div className="hero-image">
                <div className="mockup-phone">
                  <div className="phone-screen">
                    <div className="app-logo">MR</div>
                    <div className="app-status">AI解析中...</div>
                  </div>
                </div>
              </div>
            </section>

            {/* サービス機能グリッド */}
            <section className="services-grid">
              <h2 className="section-title">主要機能</h2>
              <div className="grid-container">
                <div className="service-card" onClick={openAiImageModal}>
                  <div className="service-icon">🔍</div>
                  <h3>AI画像解析</h3>
                  <p>MRI画像の自動解析と異常検出</p>
                  <button className="card-action-btn">詳細を見る</button>
                </div>
                <div className="service-card" onClick={openReportModal}>
                  <div className="service-icon">📝</div>
                  <h3>レポート自動作成</h3>
                  <p>AIが解析結果を基にレポートを生成</p>
                  <button className="card-action-btn">詳細を見る</button>
                </div>
                <div className="service-card" onClick={openDataManagementModal}>
                  <div className="service-icon">📊</div>
                  <h3>データ管理</h3>
                  <p>患者データと画像の一元管理</p>
                  <button className="card-action-btn">詳細を見る</button>
                </div>
                <div className="service-card" onClick={openWorkflowModal}>
                  <div className="service-icon">🔄</div>
                  <h3>ワークフロー</h3>
                  <p>診断からレポート作成までの流れを最適化</p>
                  <button className="card-action-btn">詳細を見る</button>
                </div>
                <div className="service-card" onClick={openMobileModal}>
                  <div className="service-icon">📱</div>
                  <h3>モバイル対応</h3>
                  <p>スマートフォンやタブレットからアクセス可能</p>
                  <button className="card-action-btn">詳細を見る</button>
                </div>
                <div className="service-card" onClick={openSecurityModal}>
                  <div className="service-icon">🔒</div>
                  <h3>セキュリティ</h3>
                  <p>医療情報の安全な管理とアクセス制御</p>
                  <button className="card-action-btn">詳細を見る</button>
                </div>
              </div>
            </section>

            {/* API接続テストセクション */}
            <section className="api-test-section">
              <h2 className="section-title">システム接続テスト</h2>
              <div className="api-test">
                <button onClick={testApi} disabled={loading} className="btn-test">
                  {loading ? 'テスト中...' : 'API接続テスト'}
                </button>
                {message && (
                  <div className="message">
                    <strong>結果:</strong> {message}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 右側のサイドバー */}
          <aside className="sidebar">
            <div className="sidebar-content">
              <h3>システム情報</h3>
              <div className="info-card">
                <h4>技術仕様</h4>
                <ul>
                  <li>Backend: PHP 8.2 + Laravel 10</li>
                  <li>Database: PostgreSQL 15</li>
                  <li>Frontend: React 18 + TypeScript + Vite</li>
                  <li>Container: Docker + Docker Compose</li>
                </ul>
              </div>
              
              <div className="info-card">
                <h4>システム状況</h4>
                <div className="status-item">
                  <span className="status-label">バックエンド:</span>
                  <span className="status-value online">稼働中</span>
                </div>
                <div className="status-item">
                  <span className="status-label">データベース:</span>
                  <span className="status-value online">稼働中</span>
                </div>
                <div className="status-item">
                  <span className="status-label">フロントエンド:</span>
                  <span className="status-value online">稼働中</span>
                </div>
              </div>

              <div className="info-card">
                <h4>お問い合わせ</h4>
                <p>システムに関するご質問やサポートが必要な場合は、お気軽にお問い合わせください。</p>
                <button className="btn-contact" onClick={openContactModal}>
                  お問い合わせ
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* モーダルコンポーネント */}
      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={closeAuthModal}
      />
      
      <DemoModal
        isOpen={demoModal}
        onClose={closeDemoModal}
      />
      
      <ContactModal
        isOpen={contactModal}
        onClose={closeContactModal}
      />

      <AIImageModal
        isOpen={aiImageModal}
        onClose={closeAiImageModal}
      />

      <ReportModal
        isOpen={reportModal}
        onClose={closeReportModal}
      />

      {/* 簡易版のモーダル（残りの機能用） */}
      {dataManagementModal && (
        <div className="modal-overlay" onClick={closeDataManagementModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDataManagementModal}>×</button>
            <h2>📊 データ管理</h2>
            <p>患者データと画像の一元管理システム</p>
            <div className="feature-details">
              <h3>主な機能</h3>
              <ul>
                <li>セキュアなデータ保存</li>
                <li>検索・フィルタリング</li>
                <li>データエクスポート</li>
                <li>バックアップ・復元</li>
              </ul>
            </div>
            <button className="btn-primary" onClick={closeDataManagementModal}>閉じる</button>
          </div>
        </div>
      )}

      {workflowModal && (
        <div className="modal-overlay" onClick={closeWorkflowModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeWorkflowModal}>×</button>
            <h2>🔄 ワークフロー</h2>
            <p>診断からレポート作成までの流れを最適化</p>
            <div className="feature-details">
              <h3>主な機能</h3>
              <ul>
                <li>タスク管理</li>
                <li>承認フロー</li>
                <li>進捗追跡</li>
                <li>自動化</li>
              </ul>
            </div>
            <button className="btn-primary" onClick={closeWorkflowModal}>閉じる</button>
          </div>
        </div>
      )}

      {mobileModal && (
        <div className="modal-overlay" onClick={closeMobileModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeMobileModal}>×</button>
            <h2>📱 モバイル対応</h2>
            <p>スマートフォンやタブレットからアクセス可能</p>
            <div className="feature-details">
              <h3>主な機能</h3>
              <ul>
                <li>レスポンシブデザイン</li>
                <li>タッチ操作対応</li>
                <li>オフライン機能</li>
                <li>プッシュ通知</li>
              </ul>
            </div>
            <button className="btn-primary" onClick={closeMobileModal}>閉じる</button>
          </div>
        </div>
      )}

      {securityModal && (
        <div className="modal-overlay" onClick={closeSecurityModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeSecurityModal}>×</button>
            <h2>🔒 セキュリティ</h2>
            <p>医療情報の安全な管理とアクセス制御</p>
            <div className="feature-details">
              <h3>主な機能</h3>
              <ul>
                <li>暗号化通信</li>
                <li>アクセス制御</li>
                <li>監査ログ</li>
                <li>コンプライアンス対応</li>
              </ul>
            </div>
            <button className="btn-primary" onClick={closeSecurityModal}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
