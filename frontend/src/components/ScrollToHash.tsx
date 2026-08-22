import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ルート遷移後にハッシュ位置まで送る。
 *
 * LP はアンカー遷移で構成されているため、/process から `/#portfolio` へ戻ると
 * ルートが切り替わった直後はまだ対象要素が描画されておらず、ブラウザ標準の
 * ハッシュ移動が空振りする。描画後に改めて探して移動させる。
 * ハッシュが無い遷移では先頭へ戻す。
 */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    // 対象要素の描画を待ってから移動する
    const id = hash.slice(1)
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [pathname, hash])

  return null
}
