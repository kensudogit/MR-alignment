import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { cleanupLegacyAuthStorage } from './utils/legacyStorageCleanup'
import './index.css'

// 旧クライアントサイド認証が残した平文パスワード等を削除してから描画する
cleanupLegacyAuthStorage()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
