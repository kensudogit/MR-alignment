import { Link } from 'react-router-dom'
import { useEffect } from 'react'

/**
 * 開発の進め方（/process）
 *
 * 要件整理からデプロイまでの各工程で「何を決めるか」を示し、
 * 各工程の実例としてこのサイト自身（MR-alignment / HealthcareLP）の実装を添える。
 * 実例は docs/project-memory.md の内容と一致させること。
 */

type Phase = {
  id: string
  no: string
  title: string
  subtitle: string
  lead: string
  decisions: string[]
  outputs: string[]
  example: {
    headline: string
    body: string
    points: string[]
  }
}

const STACK = [
  '生成AI / AI Agent',
  'RAG / GraphRAG',
  'AWS / GCP',
  'TypeScript / React / Next.js',
  'Python / Java',
  'PostgreSQL',
  'Docker',
  'CI/CD',
]

const PHASES: Phase[] = [
  {
    id: 'requirements',
    no: '01',
    title: '要件整理',
    subtitle: 'Requirements',
    lead:
      '最初に決めるのは機能一覧ではなく「何が達成できたら成功か」です。生成AIを含む案件ほど、' +
      'ここを飛ばすと「それらしい出力は出るが誰も使わない」ものが出来上がります。',
    decisions: [
      '解きたい業務課題と、成功を判定できる指標',
      '扱うデータの所在・機密区分・持ち出し可否',
      'AIに任せる範囲と、人が必ず確認する範囲',
      '応答速度・同時利用者数・稼働時間の要求水準',
      '予算と、運用に回せる人員',
    ],
    outputs: ['要件定義書', '業務フロー図', '評価指標の定義', '非機能要件の一覧'],
    example: {
      headline: 'AI資料生成に「人の手直し」を要件として組み込んだ',
      body:
        'AIが生成した資料をそのまま納品物にはできない、という前提から要件を組み立てました。' +
        '生成物と人が直した版を別々に残す設計は、この要件から決まっています。',
      points: [
        '生成したままの文章は教師データにしない（AIの出力でAIを学習させないため）',
        '手直しの量を測れることを要件に含め、品質改善の判断材料にした',
        '秘密情報をブラウザに置かないことを最初から制約として明示した',
      ],
    },
  },
  {
    id: 'architecture',
    no: '02',
    title: 'アーキテクチャ設計',
    subtitle: 'Architecture',
    lead:
      '要件のうち、後から変えると高くつくものを先に決めます。認証方式・データの持ち方・' +
      '外部サービスとの境界の3つは、動き始めてからの変更が最も高くつきます。',
    decisions: [
      '構成要素の分割と、それぞれの責務',
      '認証・認可の方式（セッションかトークンか、失効をどう実現するか）',
      '外部サービスとの境界（腐敗防止層を置くか）',
      '同期・非同期の方針、障害時の振る舞い',
      '設定と秘密情報の置き場所',
    ],
    outputs: ['構成図', 'API一覧', 'ER図', 'ADR（設計判断の記録）'],
    example: {
      headline: 'Cookie に依存しない Bearer トークン方式を選んだ',
      body:
        'フロントを Vercel、API を Railway に置く構成では両者のドメインが異なります。' +
        'サードパーティ Cookie の制限が年々強まる中、Cookie 前提の認証は将来必ず壊れると判断し、' +
        'Bearer トークン方式を選択しました。',
      points: [
        'ルーターから DB・外部HTTPまで非同期で一貫（asyncpg / httpx）',
        '失効は二段構え — ログアウトは jti 単位、パスワード変更は token_version で全トークン',
        '設定は環境変数のみ。本番で危険な設定なら起動を拒否する',
      ],
    },
  },
  {
    id: 'poc',
    no: '03',
    title: 'PoC',
    subtitle: 'Proof of Concept',
    lead:
      'PoC の目的は「動くものを見せること」ではなく「最も不確実な部分を潰すこと」です。' +
      '検証する対象を1つに絞り、判定基準を先に決めてから着手します。',
    decisions: [
      '最も不確実な論点は何か（精度か、速度か、コストか）',
      '合格・不合格の判定基準と、評価に使うデータ',
      '検証に使う期間の上限',
      '本実装へ引き継ぐもの／捨てるもの',
    ],
    outputs: ['検証コード', '評価結果', '本実装への移行判断', '概算コスト'],
    example: {
      headline: '評価を先に用意し、学習が不要と分かる経路を作った',
      body:
        'ファインチューニングは着手前に品質を測ることにしています。手直し量から生成品質を測る' +
        'エンドポイントを先に用意し、「学習しない」という判断ができるようにしました。',
      points: [
        '一度も手が入らなかった割合が高ければ、学習ではなくプロンプト修正で足りる',
        '最低件数に満たない書き出しは拒否する（学習しても文体が安定せず費用だけかかる）',
        '生成時と学習時で同じ関数からプロンプトを組み立て、乖離が起きない構造にした',
      ],
    },
  },
  {
    id: 'frontend',
    no: '04',
    title: 'フロントエンド',
    subtitle: 'Frontend',
    lead:
      '画面の作りやすさより、秘密情報を持たないことと、状態の置き場所が一箇所であることを優先します。' +
      'ブラウザに置いたものは読まれる、という前提で設計します。',
    decisions: [
      'フレームワークとレンダリング方式（SPA / SSR / SSG）',
      'API 呼び出しの集約先と、認証情報の保持方法',
      '状態管理の範囲',
      'デザインシステムとアクセシビリティの水準',
    ],
    outputs: ['画面一覧', 'コンポーネント設計', 'API クライアント', 'ビルド設定'],
    example: {
      headline: 'API クライアントを1ファイルに集約した',
      body:
        '旧実装ではフロントに OpenAI の API キーを埋め込み、公開 CORS プロキシ経由で直接呼んでいました。' +
        'これはキーが読み取れる状態です。API 呼び出しを1ファイルへ集約し、キーはサーバーだけが持つ形へ移しました。',
      points: [
        'React 18 + Vite + TypeScript + Tailwind CSS',
        '通信は services/api.ts に集約。ここを見れば通信の全体像が分かる',
        'VITE_ 変数はビルド成果物へ埋め込まれるため、秘密情報は決して置かない',
        '旧実装が localStorage に残した平文パスワードは、起動時に掃除している',
      ],
    },
  },
  {
    id: 'backend',
    no: '05',
    title: 'バックエンド',
    subtitle: 'Backend',
    lead:
      '入力は必ず検証し、失敗は握り潰さない。この2つを徹底するだけで、運用時の調査時間が大きく変わります。' +
      '外部サービスとの境界には腐敗防止層を置き、相手の都合が業務ロジックへ染み出さないようにします。',
    decisions: [
      '言語・フレームワークと、同期／非同期の方針',
      '入力検証とエラー応答の統一形式',
      'レート制限と、濫用への備え',
      '外部サービス連携の境界（変換とエラー翻訳をどこに置くか）',
      'ログに何を出し、何を出さないか',
    ],
    outputs: ['API 実装', '入力スキーマ', 'テスト一式', 'エラー設計'],
    example: {
      headline: '外部サービスの都合をルーターまで持ち込まない',
      body:
        'OpenAI 連携はサーバー側に閉じ、認証必須にしています。想定外の例外はサーバーログにのみ記録し、' +
        'クライアントへはスタックトレースを返しません。',
      points: [
        'FastAPI + Pydantic v2。入力は型と制約で受け止める',
        '認証・登録は 5回/分、資料生成は 10回/分などレート制限を用途ごとに設定',
        '状態を変える操作は必ず認証を要求し、他人のデータは 404 として扱う',
        'エラー応答は形式を統一し、フロント側の分岐を単純に保つ',
      ],
    },
  },
  {
    id: 'database',
    no: '06',
    title: 'データベース',
    subtitle: 'Database',
    lead:
      'スキーマの定義箇所は必ず一箇所にします。初期化SQLとマイグレーションの二重管理は、' +
      '環境ごとにテーブル定義が食い違う典型的な原因です。',
    decisions: [
      'スキーマの唯一の定義元をどこに置くか',
      '主キー・一意制約・インデックスの方針',
      '履歴を残すデータと、上書きしてよいデータの区別',
      'マイグレーションの適用タイミングと失敗時の扱い',
    ],
    outputs: ['ER図', 'マイグレーション', 'インデックス設計', '初期データ'],
    example: {
      headline: '生成物を上書きせず、手直しを別テーブルへ積む',
      body:
        '価値があるのは AI の出力ではなく人が直した後の文章です。生成物と手直し版を別テーブルに分け、' +
        'その差分が学習データになる構造にしています。',
      points: [
        'PostgreSQL 15。スキーマの定義元は Alembic に一本化（初期SQLは拡張の有効化のみ）',
        '手直しは何度でも積め、最後の版が最新。部分更新で直した節だけ送れる',
        'プロンプト版を残す。版が混ざったまま学習させると文体が安定しない',
        '起動時のマイグレーション失敗は握り潰さず、起動を中止する',
      ],
    },
  },
  {
    id: 'cloud',
    no: '07',
    title: 'クラウド',
    subtitle: 'Cloud',
    lead:
      '構成の派手さより、運用の手数と月額が読めることを優先します。' +
      '規模が読めない段階で本格的なオーケストレーションを組むと、運用コストだけが先に発生します。',
    decisions: [
      'マネージドサービスに寄せる範囲',
      '秘密情報の管理方法（環境変数か、シークレット管理サービスか）',
      '許可するオリジンと通信経路',
      '監視・ログ・バックアップの取り方',
      '想定利用量に対する月額の見積り',
    ],
    outputs: ['インフラ構成図', '環境変数一覧', '監視設定', 'コスト試算'],
    example: {
      headline: 'フロントとAPIを分け、秘密情報は環境変数だけで完結させる',
      body:
        'フロントエンドは Vercel、API とデータベースは Railway に配置しています。' +
        '設定は環境変数からそのままアプリ設定へマッピングされるため、環境ごとのコード変更が不要です。',
      points: [
        'API とフロントを別サービスとしてデプロイし、それぞれ独立して更新できる',
        '許可オリジンは明示指定。ワイルドカードは使わない',
        '本番で危険な設定（デバッグ有効・鍵未設定）は起動時の検証で弾く',
        'AWS / GCP を使う案件でも、判断基準は同じ — 手数と月額が読めるか',
      ],
    },
  },
  {
    id: 'docker',
    no: '08',
    title: 'Docker',
    subtitle: 'Containerization',
    lead:
      '開発環境は「クローンして1コマンドで動く」ことを目標にします。' +
      '本番イメージは、ビルドに使ったものを持ち込まないことと、root で動かさないことが要点です。',
    decisions: [
      '開発と本番でイメージを分けるか',
      'ビルド用と実行用のステージ分割',
      '実行ユーザーと権限',
      'ヘルスチェックと起動順序の制御',
    ],
    outputs: ['Dockerfile', 'docker-compose.yml', '起動スクリプト', 'ヘルスチェック定義'],
    example: {
      headline: 'マルチステージで非rootユーザー実行',
      body:
        'ビルド時だけ必要なコンパイラ類を本番イメージへ持ち込まないよう、ステージを分けています。' +
        '実行は専用ユーザーで行い、ヘルスチェックで生存を確認します。',
      points: [
        'ローカルは compose 一発で DB・API・フロント・メール確認・DB管理画面が揃う',
        '送信メールはローカルのメールキャッチャーで確認でき、実際には外へ出さない',
        'ビルド用ステージと実行用ステージを分離し、実行イメージを小さく保つ',
        'パスワード類は既定値を持ちつつ環境変数で上書きできる',
      ],
    },
  },
  {
    id: 'cicd',
    no: '09',
    title: 'CI/CD',
    subtitle: 'Continuous Integration',
    lead:
      '事故を止める仕掛けは、早い段階に置くほど安く済みます。とくに秘密情報の混入は、' +
      'コミットされた時点で履歴に残るため、コミット前に止めるのが最も安価です。',
    decisions: [
      '自動で走らせる検査（型・静的解析・テスト）',
      '検査を止める段階（コミット前・PR・デプロイ前）',
      'デプロイの起点（ブランチへの push か、手動承認か）',
      '失敗時に何を止めるか',
    ],
    outputs: ['フック設定', 'ワークフロー定義', 'ブランチ運用ルール'],
    example: {
      headline: '秘密情報の混入はコミット前に止める',
      body:
        'APIキーらしき文字列と .env ファイルの追加を、コミット前のフックで拒否しています。' +
        '履歴に入ってからの除去は、公開リポジトリでは事故として扱う必要が出てきます。',
      points: [
        'クローンごとに git config core.hooksPath .githooks を一度実行して有効化',
        'デプロイは対象ブランチへの push を起点に、各サービスが自動で追随する',
        'バックエンドはテストを用意済み。型検査・静的解析も導入済み',
        '現状これらの検査は手元とフックで走る構成。PR 単位の自動実行は今後の課題',
      ],
    },
  },
  {
    id: 'deploy',
    no: '10',
    title: 'デプロイ手順',
    subtitle: 'Deployment',
    lead:
      '手順書は「失敗したときにどこで止まるか」まで書いて初めて役に立ちます。' +
      '起動シーケンスの各段階で、失敗を検知して止めることを徹底します。',
    decisions: [
      '環境変数を投入する順序と確認方法',
      'マイグレーションを流すタイミング',
      '公開前の確認項目',
      '切り戻しの手順',
    ],
    outputs: ['デプロイ手順書', '環境変数一覧', '確認チェックリスト', '切り戻し手順'],
    example: {
      headline: '起動シーケンスの各段階で失敗を検知して止める',
      body:
        'コンテナ起動時に、設定検証 → DB接続待ち → マイグレーション → サーバー起動の順で進み、' +
        'どこかで失敗したらそこで起動を中止します。中途半端に起動して後から気づく状態を作りません。',
      points: [
        '1. 設定検証 — 危険な設定なら起動しない',
        '2. DB 接続待ち — 一定回数試して繋がらなければ中止',
        '3. マイグレーション適用 — 失敗したら中止',
        '4. アプリケーション起動 — ここまで通って初めて公開される',
      ],
    },
  },
]

const CHECKLIST = [
  '要件に「成功の判定基準」が書かれているか',
  '秘密情報がブラウザ側へ渡っていないか',
  'スキーマの定義元が一箇所に絞られているか',
  '外部サービスの都合が業務ロジックへ染み出していないか',
  '起動時に危険な設定を検知して止められるか',
  '失敗したときの切り戻し手順が用意されているか',
]

function PhaseNav() {
  return (
    <nav aria-label="工程一覧" className="glass-card rounded-3xl p-6 md:p-8">
      <p className="mb-4 text-sm font-bold text-gray-500">工程一覧</p>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PHASES.map((phase) => (
          <li key={phase.id}>
            <a
              href={`#${phase.id}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-healthcare-50 hover:text-healthcare-700"
            >
              <span className="font-mono text-xs font-bold text-healthcare-500">{phase.no}</span>
              <span className="font-medium">{phase.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function PhaseSection({ phase }: { phase: Phase }) {
  return (
    <section id={phase.id} className="scroll-mt-28">
      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="border-b border-white/40 bg-gradient-to-r from-healthcare-50 to-white px-6 py-6 md:px-10">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-3xl font-extrabold text-healthcare-300">{phase.no}</span>
            <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">{phase.title}</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {phase.subtitle}
            </span>
          </div>
          <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">{phase.lead}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 px-6 py-8 md:grid-cols-2 md:px-10">
          <div>
            <h3 className="mb-3 text-sm font-bold text-healthcare-700">ここで決めること</h3>
            <ul className="space-y-2">
              {phase.decisions.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-healthcare-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-healthcare-700">成果物</h3>
            <ul className="flex flex-wrap gap-2">
              {phase.outputs.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-healthcare-50 px-3 py-1 text-xs font-medium text-healthcare-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/40 bg-white/50 px-6 py-8 md:px-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-amber/15 px-3 py-1 text-xs font-bold text-amber-700">
              実例 — このサイト
            </span>
            <h3 className="text-base font-bold text-gray-900">{phase.example.headline}</h3>
          </div>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-gray-600">{phase.example.body}</p>
          <ul className="space-y-2">
            {phase.example.points.map((point) => (
              <li key={point} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-amber" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default function ProcessPage() {
  useEffect(() => {
    // LP 側はタイトルを設定していないため、離脱時に元へ戻す。
    // 戻さないと LP に帰ったあともタブが「開発の進め方」のままになる。
    const previous = document.title
    document.title = '開発の進め方 | 須藤技術士事務所'
    return () => {
      document.title = previous
    }
  }, [])

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
          <Link to="/" className="btn-secondary">
            トップへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="py-14 md:py-20">
          <p className="mb-4 text-sm font-bold tracking-widest text-healthcare-600">DEVELOPMENT PROCESS</p>
          <h1 className="section-title text-3xl font-extrabold leading-tight md:text-5xl">
            要件整理からデプロイまで、
            <br />
            一貫して設計・実装します
          </h1>
          <p className="mt-6 max-w-3xl leading-relaxed text-gray-600">
            Javaを中心としたバックエンド開発の経験を基盤に、現在は生成AI・AIエージェント・クラウド・
            データ基盤・Webシステムを組み合わせたシステム設計・開発に取り組んでいます。
            このページでは、各工程で実際に何を決めているのかを、
            <Link to="/" className="mx-1 font-medium text-healthcare-600 underline decoration-healthcare-300 underline-offset-2">
              このサイト自身
            </Link>
            の実装を例に説明します。
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {STACK.map((item) => (
              <li
                key={item}
                className="rounded-full border border-healthcare-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-healthcare-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <PhaseNav />

        <div className="mt-10 space-y-10">
          {PHASES.map((phase) => (
            <PhaseSection key={phase.id} phase={phase} />
          ))}
        </div>

        <section className="mt-16">
          <div className="glass-card rounded-3xl p-6 md:p-10">
            <h2 className="text-2xl font-extrabold text-gray-900">工程をまたいで必ず確認すること</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              工程ごとの成果物が揃っていても、次の点が抜けていると運用に入ってから問題になります。
              設計レビューではこの6点を毎回確認しています。
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {CHECKLIST.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-white/60 px-4 py-3 text-sm leading-relaxed text-gray-700"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-emerald/15 text-xs font-bold text-emerald-700"
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <div className="glass-card rounded-3xl p-6 text-center md:p-10">
            <h2 className="text-xl font-extrabold text-gray-900 md:text-2xl">
              進め方について、個別にご相談いただけます
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
              どの工程から着手すべきか、既存システムをどう活かすか、PoC の判定基準をどう置くか。
              現状をお聞きしたうえで具体的にお答えします。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/" className="btn-gradient">
                トップページへ
              </Link>
              <Link to="/#portfolio" className="btn-secondary">
                開発実績を見る
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
