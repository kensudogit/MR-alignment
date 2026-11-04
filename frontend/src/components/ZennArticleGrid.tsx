import { useMemo, useState } from 'react';
import { zennArticles, ZENN_CATEGORY_ORDER } from '../data/zennArticles';

const INITIAL_VISIBLE = 6;
const LOAD_MORE_STEP = 6;

function formatPublishedDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ZennArticleGrid() {
  const [category, setCategory] = useState('すべて');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filtered = useMemo(() => {
    if (category === 'すべて') return zennArticles;
    return zennArticles.filter((a) => a.category === category);
  }, [category]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  const onCategoryChange = (next: string) => {
    setCategory(next);
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <div className="mr-zenn mt-20 border-t border-white/10 pt-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mr-eyebrow mb-2">Zenn</p>
          <h3 className="text-2xl font-bold text-white md:text-3xl">技術記事（Zenn）</h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-400 md:text-base">
            公開中の Zenn 記事を一覧しています。カードをクリックすると Zenn で記事を開きます（新しいタブ）。
          </p>
        </div>
        <a
          href="https://zenn.dev/kensudo1203"
          target="_blank"
          rel="noopener noreferrer"
          className="mr-zenn-profile-link text-sm font-semibold text-teal-300 hover:text-teal-200"
        >
          Zenn プロフィール →
        </a>
      </div>

      <div className="mr-zenn-filters mb-8 flex flex-wrap gap-2" role="tablist" aria-label="記事カテゴリ">
        {ZENN_CATEGORY_ORDER.map((label) => {
          const count =
            label === 'すべて'
              ? zennArticles.length
              : zennArticles.filter((a) => a.category === label).length;
          if (label !== 'すべて' && count === 0) return null;
          const active = category === label;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onCategoryChange(label)}
              className={`mr-zenn-filter-pill${active ? ' is-active' : ''}`}
            >
              {label}
              <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-gray-400">
          このカテゴリに表示できる公開記事はありません。
        </p>
      ) : (
        <ul className="mr-zenn-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((article) => (
            <li key={article.slug}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-zenn-card group flex h-full flex-col"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {article.emoji}
                  </span>
                  <span className="shrink-0 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-200">
                    {article.category}
                  </span>
                </div>
                <h4 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-white group-hover:text-teal-200">
                  {article.title}
                </h4>
                <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-400">
                  {article.summary}
                </p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-gray-500">
                  <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
                  <span className="font-semibold text-teal-400/90 group-hover:text-teal-300">
                    記事を読む ↗
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {canLoadMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setVisibleCount((n) => Math.min(n + LOAD_MORE_STEP, filtered.length))}
          >
            もっと見る（残り {filtered.length - visibleCount} 件）
          </button>
        </div>
      )}
    </div>
  );
}
