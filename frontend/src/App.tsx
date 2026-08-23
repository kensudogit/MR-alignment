import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HealthcareLP from './components/healthcare_lp_react_tailwind_ui.jsx'
import ProcessPage from './pages/ProcessPage'
import CodingAgentsPage from './pages/CodingAgentsPage'
import LegalPage from './pages/LegalPage'
import ScrollToHash from './components/ScrollToHash'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'
import './healthcare-lp.css'

/**
 * Cookie 同意バナーは削除した。
 * 本サイトは広告・解析の Cookie を使わず、保持するのは同一オリジンの
 * localStorage（ログイン状態）だけなので、同意を取る対象がない。
 * 「拒否」を押しても挙動が変わらないバナーは、実態のない同意を求めることになる。
 * 取得する情報とその扱いは /legal のプライバシーポリシーに記載している。
 */
function App() {
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
            <Route path="/coding-agents" element={<CodingAgentsPage />} />
            <Route path="/legal" element={<LegalPage />} />
            {/* 未知のパスは LP を返す（Vercel / nginx 側も index.html へ寄せている） */}
            <Route path="*" element={<HealthcareLP />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
