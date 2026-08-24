import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { CHAPTERS, MANUAL_VERSIONS, type Block, type Chapter, type Section } from '../data/reactManual'

/**
 * React + Next.js + TypeScript 開発マニュアル（/react-manual）
 *
 * 本文は data/reactManual.ts にある。ここは並べるだけ。
 *
 * 実装中に引く資料なので、通読ではなく検索して使う前提で作っている。
 *   - 上部の検索で節を絞り込める（見出し・本文・コードすべてが対象）
 *   - 節ごとに id があるので /react-manual#hooks-deps のように直接指せる
 *   - 見出しの # を押すとその節の URL がコピーされる
 */

/** 検索対象の文字列を節から組み立てる。コード中の識別子も引っかけたいので全部含める */
function sectionText(chapter: Chapter, section: Section): string {
  const parts: string[] = [chapter.title, chapter.subtitle, section.title, section.lead]

  for (const block of section.blocks) {
    switch (block.kind) {
      case 'text':
        parts.push(block.body)
        break
      case 'list':
        parts.push(block.title ?? '', ...block.items)
        break
      case 'code':
        parts.push(block.label, ...block.code)
        break
      case 'compare':
        parts.push(block.bad.label, ...block.bad.code, block.good.label, ...block.good.code)
        break
      case 'note':
        parts.push(block.title, block.body)
        break
      case 'table':
        parts.push(...block.head, ...block.rows.flat())
        break
    }
  }

  return parts.join('\n').toLowerCase()
}

/** 章 → 節 → 検索用テキスト。検索のたびに組み立て直さないよう一度だけ作る */
const SEARCH_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>()
  for (const chapter of CHAPTERS) {
    for (const section of chapter.sections) {
      index.set(`${chapter.id}/${section.id}`, sectionText(chapter, section))
    }
  }
  return index
})()

function CodePanel({ label, code, tone = 'neutral' }: { label: string; code: string[]; tone?: 'neutral' | 'bad' | 'good' }) {
  const [copied, setCopied] = useState(false)

  const frameClass =
    tone === 'bad'
      ? 'border-red-200 bg-red-50/50'
      : tone === 'good'
        ? 'border-emerald-200 bg-emerald-50/50'
        : 'border-gray-200 bg-white/70'
  const labelClass = tone === 'bad' ? 'text-red-700' : tone === 'good' ? 'text-emerald-700' : 'text-gray-600'

  async function copy() {
    try {
      await navigator.clipboard.writeText(code.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // クリップボードが使えない環境（http や権限拒否）では黙って諦める。
      // コード自体は選択してコピーできるので、ここで失敗を騒ぐ必要はない。
    }
  }

  return (
    <div className={`rounded-2xl border p-4 ${frameClass}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className={`text-xs font-bold ${labelClass}`}>{label}</p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg border border-gray-200 bg-white/80 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-gray-900/95 px-4 py-3 text-xs leading-relaxed text-gray-100">
        <code>{code.join('\n')}</code>
      </pre>
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'text':
      return <p className="max-w-3xl text-sm leading-relaxed text-gray-600">{block.body}</p>

    case 'list':
      return (
        <div>
          {block.title && <h4 className="mb-3 text-sm font-bold text-healthcare-700">{block.title}</h4>}
          <ul className="space-y-2">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-healthcare-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )

    case 'code':
      return <CodePanel label={block.label} code={block.code} />

    case 'compare':
      return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CodePanel label={block.bad.label} code={block.bad.code} tone="bad" />
          <CodePanel label={block.good.label} code={block.good.code} tone="good" />
        </div>
      )

    case 'note':
      return (
        <div
          className={`rounded-2xl border px-4 py-3 ${
            block.tone === 'warn' ? 'border-amber-200 bg-amber-50/70' : 'border-healthcare-200 bg-healthcare-50/60'
          }`}
        >
          <p className={`text-sm font-bold ${block.tone === 'warn' ? 'text-amber-900' : 'text-healthcare-800'}`}>
            {block.tone === 'warn' ? '注意 — ' : 'ヒント — '}
            {block.title}
          </p>
          <p className={`mt-2 text-sm leading-relaxed ${block.tone === 'warn' ? 'text-amber-900' : 'text-healthcare-900'}`}>
            {block.body}
          </p>
        </div>
      )

    case 'table':
      return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white/70">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="bg-healthcare-50/70">
                {block.head.map((cell) => (
                  <th key={cell} className="border-b border-gray-200 px-3 py-2 text-xs font-bold text-healthcare-800">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join('|')}>
                  {row.map((cell, i) => (
                    <td
                      key={`${row[0]}-${i}`}
                      className={`border-b border-gray-100 px-3 py-2 align-top text-xs leading-relaxed ${
                        i === 0 ? 'font-mono font-medium text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

function SectionView({ section }: { section: Section }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#${section.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // 失敗しても URL バーから拾えるので何もしない
    }
    window.location.hash = section.id
  }

  return (
    <section id={section.id} className="scroll-mt-28 border-t border-white/50 px-6 py-8 first:border-t-0 md:px-10">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
        <button
          type="button"
          onClick={copyLink}
          title="この節へのリンクをコピー"
          className="font-mono text-xs text-gray-400 transition-colors hover:text-healthcare-600"
        >
          {copied ? 'リンクをコピーしました' : `#${section.id}`}
        </button>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">{section.lead}</p>
      <div className="mt-5 space-y-5">
        {section.blocks.map((block, i) => (
          <BlockView key={`${section.id}-${i}`} block={block} />
        ))}
      </div>
    </section>
  )
}

function ChapterView({ chapter }: { chapter: Chapter }) {
  return (
    <section id={chapter.id} className="scroll-mt-28">
      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="border-b border-white/40 bg-gradient-to-r from-healthcare-50 to-white px-6 py-6 md:px-10">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-3xl font-extrabold text-healthcare-300">{chapter.no}</span>
            <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">{chapter.title}</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{chapter.subtitle}</span>
          </div>
          <p className="mt-3 max-w-3xl leading-relaxed text-gray-600">{chapter.summary}</p>
        </div>
        {chapter.sections.map((section) => (
          <SectionView key={section.id} section={section} />
        ))}
      </div>
    </section>
  )
}

function ChapterNav({ chapters }: { chapters: Chapter[] }) {
  return (
    <nav aria-label="目次" className="glass-card rounded-3xl p-6 md:p-8">
      <p className="mb-4 text-sm font-bold text-gray-500">目次</p>
      <ol className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-healthcare-50 hover:text-healthcare-700"
            >
              <span className="font-mono text-xs font-bold text-healthcare-500">{chapter.no}</span>
              <span className="font-medium">{chapter.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default function ReactManualPage() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    // LP 側はタイトルを設定していないため、離脱時に元へ戻す。
    // 戻さないと LP に帰ったあともタブがマニュアルのままになる。
    const previous = document.title
    document.title = 'React / Next.js / TypeScript 開発マニュアル | 須藤技術士事務所'
    return () => {
      document.title = previous
    }
  }, [])

  const keyword = query.trim().toLowerCase()

  const visibleChapters = useMemo(() => {
    if (!keyword) return CHAPTERS

    return CHAPTERS.map((chapter) => ({
      ...chapter,
      sections: chapter.sections.filter((section) =>
        SEARCH_INDEX.get(`${chapter.id}/${section.id}`)?.includes(keyword),
      ),
    })).filter((chapter) => chapter.sections.length > 0)
  }, [keyword])

  const hitCount = visibleChapters.reduce((total, chapter) => total + chapter.sections.length, 0)
  const totalCount = CHAPTERS.reduce((total, chapter) => total + chapter.sections.length, 0)

  return (
    <div className="min-h-screen bg-gradient-healthcare">
      <header className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="metallic-container flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
              <img src="/PC.png" alt="須藤技術士事務所" className="relative z-10 h-12 w-12 object-contain" />
            </div>
            <span className="text-sm font-bold gradient-text">須藤技術士事務所</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/process" className="hidden text-sm text-gray-700 hover:text-healthcare-600 md:inline">
              開発の進め方
            </Link>
            <Link to="/coding-agents" className="hidden text-sm text-gray-700 hover:text-healthcare-600 md:inline">
              AI開発講習
            </Link>
            <Link to="/" className="btn-secondary">
              トップへ戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="py-14 md:py-20">
          <p className="mb-4 text-sm font-bold tracking-widest text-healthcare-600">DEVELOPMENT MANUAL</p>
          <h1 className="section-title text-3xl font-extrabold leading-tight md:text-5xl">
            React / Next.js / TypeScript
            <br />
            開発マニュアル
          </h1>
          <p className="mt-6 max-w-3xl leading-relaxed text-gray-600">
            実装中に手を止めずに引くための資料です。機能の紹介ではなく、
            <strong className="font-bold text-gray-800">どう書くか、なぜそう書くか</strong>
            を並べています。節ごとに URL があるので、レビューや作業指示では
            <span className="mx-1 font-mono text-xs text-healthcare-700">/react-manual#hooks-deps</span>
            のように節を直接指してください。工程全体の進め方は
            <Link
              to="/process"
              className="mx-1 font-medium text-healthcare-600 underline decoration-healthcare-300 underline-offset-2"
            >
              開発の進め方
            </Link>
            にあります。
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {MANUAL_VERSIONS.map((item) => (
              <div key={item.name} className="rounded-2xl border border-healthcare-200 bg-white/70 px-4 py-3">
                <p className="text-xs font-bold text-healthcare-700">{item.name}</p>
                <p className="font-mono text-sm font-bold text-gray-900">{item.version}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="glass-card mb-6 rounded-3xl p-5 md:p-6">
          <label htmlFor="manual-search" className="mb-2 block text-sm font-bold text-gray-700">
            マニュアル内を検索
          </label>
          <input
            id="manual-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'useEffect / "use client" / revalidate / hydration など'}
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-healthcare-400 focus:ring-2 focus:ring-healthcare-100"
          />
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {keyword ? `${hitCount} 件の節が該当しました（全 ${totalCount} 節）` : `見出し・本文・コードを対象に、全 ${totalCount} 節から探します`}
          </p>
        </div>

        {!keyword && <ChapterNav chapters={CHAPTERS} />}

        {hitCount === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center">
            <p className="text-sm text-gray-600">
              「{query}」に一致する節はありませんでした。英語のキーワード（useEffect、revalidate など）でもお試しください。
            </p>
            <button type="button" onClick={() => setQuery('')} className="btn-secondary mt-5">
              検索を解除する
            </button>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {visibleChapters.map((chapter) => (
              <ChapterView key={chapter.id} chapter={chapter} />
            ))}
          </div>
        )}

        <section className="mt-10">
          <div className="glass-card rounded-3xl p-6 text-center md:p-10">
            <h2 className="text-xl font-extrabold text-gray-900 md:text-2xl">
              技術選定や実装方針について、個別にご相談いただけます
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
              App Router へ移すべきか、既存の React アプリをどう整理するか、チームでどの規約を採るか。
              現状をお聞きしたうえで具体的にお答えします。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/" className="btn-gradient">
                トップページへ
              </Link>
              <Link to="/process" className="btn-secondary">
                開発の進め方を見る
              </Link>
              <Link to="/coding-agents" className="btn-secondary">
                AI開発講習を見る
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
