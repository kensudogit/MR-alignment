import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * 本番ビルドでは VITE_API_URL を必須にする。
 *
 * 未設定のままビルドすると services/api.ts の既定値 http://localhost:8000 が
 * バンドルに焼き込まれ、公開後は資料請求も問い合わせも一切サーバーへ届かない
 * （画面上はエラーも出ないため、気づかないまま見込み客を取りこぼす）。
 * Dockerfile.frontend は同じ検査をしているが、Vercel の npm run build は
 * それを通らないため、ここでも止める。
 */
const requireApiUrlInProduction = (mode: string) => {
  if (mode !== 'production') return
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (!env.VITE_API_URL) {
    throw new Error(
      [
        'VITE_API_URL が未設定のため本番ビルドを中止しました。',
        '  Vercel  : Project Settings > Environment Variables に VITE_API_URL を追加',
        '  ローカル: VITE_API_URL=https://api.example.com npm run build',
        'バックエンドの URL（オリジンのみ。/api は付けない）を指定してください。',
      ].join('\n')
    )
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  requireApiUrlInProduction(mode)

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: false,
    cors: true,
    watch: {
      usePolling: true
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    assetsInlineLimit: 0,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios']
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*'
    }
  },
  define: {
    global: 'globalThis',
  },
  envPrefix: 'VITE_',
  envDir: '.'
  }
})
