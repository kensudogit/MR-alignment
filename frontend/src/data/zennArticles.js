/**
 * Zenn 公開記事（ブログ・ニュースセクション用）
 *
 * 更新手順:
 *   1. scripts/fetch_zenn_meta.py で API からメタデータ取得
 *   2. 未公開（403）・重複 slug は載せない
 *   3. url は /edit ではなく https://zenn.dev/{user}/articles/{slug}
 *
 * 2026-11-04: 依頼17件のうち公開確認15件（20ad564086699b, f75cd00f4017de は非公開のため除外）
 */

/** @typedef {{ slug: string, title: string, summary: string, publishedAt: string, category: string, topics: string[], emoji: string, url: string }} ZennArticle */

/** @type {ZennArticle[]} */
export const zennArticles = [
  {
    slug: '9248efd636350b',
    title: 'Bedrock RAG を本番向けに：Cognito 認証・テナント ACL・Docker/Terraform まで',
    summary:
      'Amazon Bedrock と RAG をマルチテナントで安全に運用するための認証・ACL・IaC 構成を整理した実装記録です。',
    publishedAt: '2026-10-25T14:47:03.823+09:00',
    category: 'AI・RAG',
    topics: ['aws', 'terraform', 'cognito', 'bedrock', 'rag'],
    emoji: '⛳',
    url: 'https://zenn.dev/kensudo1203/articles/9248efd636350b',
  },
  {
    slug: '2968d602e166a0',
    title: '「明日の需要」と「最短ルート」を、そのまま信じない',
    summary:
      '需要予測と配送ルート最適化を組み合わせる際に、モデル出力をそのまま現場判断に使わない設計上の要点をまとめています。',
    publishedAt: '2026-10-23T19:25:52.658+09:00',
    category: 'AI・データ',
    topics: ['nextjs', 'python', 'react', 'typescript', 'llm'],
    emoji: '📘',
    url: 'https://zenn.dev/kensudo1203/articles/2968d602e166a0',
  },
  {
    slug: 'bba6e30a5afd7c',
    title: 'AI顧客の反応を変化させ、毎回異なる商談展開を生み出す',
    summary: '商談トレーニング向けに AI 顧客の反応を動的に変えるシミュレーション設計と実装の考え方を紹介します。',
    publishedAt: '2026-10-22T15:59:30.776+09:00',
    category: 'AI・RAG',
    topics: ['nextjs', 'postgresql', 'python', 'react', 'typescript'],
    emoji: '💡',
    url: 'https://zenn.dev/kensudo1203/articles/bba6e30a5afd7c',
  },
  {
    slug: '871dfc236e1fa0',
    title: '保全日報を RAG に載せるとき、ベクトルだけでは設備名が落ちる',
    summary: '製造現場の保全記録を RAG 化する際、ベクトル検索だけでは拾えない固有名詞をどう扱うかを解説します。',
    publishedAt: '2026-10-21T13:54:01.915+09:00',
    category: 'AI・RAG',
    topics: ['postgresql', 'python', 'langchain', 'llamaindex'],
    emoji: '🐷',
    url: 'https://zenn.dev/kensudo1203/articles/871dfc236e1fa0',
  },
  {
    slug: 'd3d5e2e9c4e439',
    title: '船級承認はソフトが出さない — 船舶初期設計AIの関門',
    summary: '船舶基本設計 AI で船級・規則対応をどう位置づけるか、ソフトが代替できない関門を整理した記事です。',
    publishedAt: '2026-10-20T11:34:20.398+09:00',
    category: 'Web・SaaS',
    topics: ['nextjs', 'postgresql', 'python', 'fastapi', 'sqlalchemy'],
    emoji: '😺',
    url: 'https://zenn.dev/kensudo1203/articles/d3d5e2e9c4e439',
  },
  {
    slug: '14b536888ff813',
    title:
      'AIコーディングツールが出力する資材を、WordPressサイトへ継続的に実装・反映するためのワークフローパッケージ',
    summary: 'AI が生成したコードやコンテンツを WordPress へ安全に反映する CI/CD 的ワークフローの設計です。',
    publishedAt: '2026-10-19T06:59:07.931+09:00',
    category: 'DX・自動化',
    topics: ['nextjs', 'python', 'react', 'typescript', 'wordpress'],
    emoji: '🌟',
    url: 'https://zenn.dev/kensudo1203/articles/14b536888ff813',
  },
  {
    slug: '488ac74d576ff1',
    title: 'RPGⅢをAIで読むときに、行番号を創作しない',
    summary: 'レガシー RPG ソースを AI で調査する際、根拠のない行番号引用を防ぐ検証付きの進め方をまとめています。',
    publishedAt: '2026-10-18T04:06:23.491+09:00',
    category: 'レガシー移行',
    topics: ['python', 'migration', 'legacy', 'ibmi', 'ibmirpg'],
    emoji: '📑',
    url: 'https://zenn.dev/kensudo1203/articles/488ac74d576ff1',
  },
  {
    slug: '1988b9999d48b1',
    title: '設計標準書からレビュー用チェックリストを自動生成する',
    summary: '設計標準ドキュメントを入力に、レビューで使えるチェックリストを生成するパイプラインの考え方です。',
    publishedAt: '2026-10-17T03:51:48.182+09:00',
    category: 'DX・自動化',
    topics: ['nextjs', 'python', 'fastapi'],
    emoji: '🎃',
    url: 'https://zenn.dev/kensudo1203/articles/1988b9999d48b1',
  },
  {
    slug: '1a64bbe88e024d',
    title: '「真の企業価値」を市場から独立させる — 2段階DCFと候補集合の最適解',
    summary: '2 段階 DCF と候補集合探索を組み合わせた企業価値評価のモデリングと実装の要点を解説します。',
    publishedAt: '2026-10-15T17:42:41.335+09:00',
    category: 'AI・データ',
    topics: ['nextjs', 'python', 'fastapi', 'rag', 'langgraph'],
    emoji: '😺',
    url: 'https://zenn.dev/kensudo1203/articles/1a64bbe88e024d',
  },
  {
    slug: 'e2d01da13552d5',
    title: 'FastAPI + Next.js で FX 分析基盤を作った話 — BFF・ペーパー取引・OpenAI を叩かないテスト',
    summary: 'FX 分析 SaaS の BFF 構成、ペーパー取引、外部 API をモックするテスト戦略までを一続きで紹介します。',
    publishedAt: '2026-10-14T16:47:56.742+09:00',
    category: '金融・量化',
    topics: ['nextjs', 'python', 'typescript', 'fastapi'],
    emoji: '🦔',
    url: 'https://zenn.dev/kensudo1203/articles/e2d01da13552d5',
  },
  {
    slug: '84466292c932a2',
    title: '株価予測ツールで in-sample の自信を発注に使わない — walk-forward と利益関門',
    summary: 'バックテスト結果を過信しない walk-forward 検証と、発注前の利益関門の設計について書いています。',
    publishedAt: '2026-10-13T15:37:22.032+09:00',
    category: '金融・量化',
    topics: ['nextjs', 'postgresql', 'typescript', 'python'],
    emoji: '🎉',
    url: 'https://zenn.dev/kensudo1203/articles/84466292c932a2',
  },
  {
    slug: '2d925e7c978e32',
    title: '架電システム',
    summary: 'Twilio と PostgreSQL を使った架電 SaaS の構成、通話フロー、運用上の注意点をまとめた記事です。',
    publishedAt: '2026-10-12T13:34:31.832+09:00',
    category: 'SaaS・架電',
    topics: ['postgresql', 'python', 'twilio', 'saas'],
    emoji: '💡',
    url: 'https://zenn.dev/kensudo1203/articles/2d925e7c978e32',
  },
  {
    slug: '3710ac5d264bd1',
    title: '未初期化のプラグインは start しない — 倉庫WMSの状態機械と引当在庫',
    summary: 'マイクロカーネル型 WMS におけるプラグイン状態管理と引当在庫の整合性を保つ設計パターンです。',
    publishedAt: '2026-10-10T09:26:25.455+09:00',
    category: 'バックエンド',
    topics: ['angular', 'docker', 'java', 'postgresql', 'マイクロサービス'],
    emoji: '🐷',
    url: 'https://zenn.dev/kensudo1203/articles/3710ac5d264bd1',
  },
  {
    slug: '9dbb8ee016e44c',
    title: 'Pythonで金融戦略のバックテストと最適化を統合する ― FastAPI・Next.jsによる戦略評価基盤の設計',
    summary: '戦略バックテストからパラメータ探索・最適化までを FastAPI と Next.js で一体運用する基盤設計です。',
    publishedAt: '2026-10-08T16:16:14.658+09:00',
    category: '金融・量化',
    topics: ['python', 'バックテスト'],
    emoji: '🙌',
    url: 'https://zenn.dev/kensudo1203/articles/9dbb8ee016e44c',
  },
  {
    slug: '37c7ffd31f22ac',
    title: 'AWS Bedrock × RAGで構築する企業向け生成AI基盤 ― 検索・安全性・評価・運用を一体化する設計',
    summary: 'Bedrock RAG の検索品質、ガードレール、評価、運用監視を一つの基盤として設計する際の整理です。',
    publishedAt: '2026-10-08T14:45:04.249+09:00',
    category: 'AI・RAG',
    topics: ['aws', 'python', 'fastapi', 'bedrock', 'rag'],
    emoji: '🗂',
    url: 'https://zenn.dev/kensudo1203/articles/37c7ffd31f22ac',
  },
];

/** カテゴリフィルタ（表示順） */
export const ZENN_CATEGORY_ORDER = [
  'すべて',
  'AI・RAG',
  'AI・データ',
  'Web・SaaS',
  'SaaS・架電',
  '金融・量化',
  'レガシー移行',
  'DX・自動化',
  'バックエンド',
];

/** slug の重複がないことを保証（ビルド時チェック用） */
export function assertUniqueZennSlugs() {
  const seen = new Set();
  for (const a of zennArticles) {
    if (seen.has(a.slug)) {
      throw new Error(`Duplicate Zenn slug: ${a.slug}`);
    }
    seen.add(a.slug);
  }
}

assertUniqueZennSlugs();
