import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HealthcareLP from './components/healthcare_lp_react_tailwind_ui.jsx'
import CookieConsent from './components/CookieConsent'
import ProcessPage from './pages/ProcessPage'
import ScrollToHash from './components/ScrollToHash'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'
import './healthcare-lp.css'

function App() {
  const handleCookieAccept = () => {
    console.log('Cookie consent accepted');
    // 必要に応じて追加の処理を実装
  };

  const handleCookieDecline = () => {
    console.log('Cookie consent declined');
    // 必要に応じて追加の処理を実装
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          {/* 別ページから /#portfolio のようなリンクで戻ったとき、該当位置まで送る */}
          <ScrollToHash />
          <Routes>
            {/* 認証されていないユーザーでもサイトにアクセス可能 */}
            <Route path="/" element={<HealthcareLP />} />
            <Route path="/process" element={<ProcessPage />} />
            {/* 未知のパスは LP を返す（Vercel / nginx 側も index.html へ寄せている） */}
            <Route path="*" element={<HealthcareLP />} />
          </Routes>
          <CookieConsent
            onAccept={handleCookieAccept}
            onDecline={handleCookieDecline}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
