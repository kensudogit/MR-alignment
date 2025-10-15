import HealthcareLP from './components/healthcare_lp_react_tailwind_ui.jsx'
import CookieConsent from './components/CookieConsent'
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
    <AuthProvider>
      <div className="App">
        {/* 認証されていないユーザーでもサイトにアクセス可能 */}
        <HealthcareLP />
        <CookieConsent 
          onAccept={handleCookieAccept}
          onDecline={handleCookieDecline}
        />
      </div>
    </AuthProvider>
  )
}

export default App
