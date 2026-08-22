import { Link } from 'react-router-dom'
import { useEffect } from 'react'

/**
 * コーディングエージェント講習（/coding-agents）
 *
 * OpenAI Codex CLI と Claude Code を、社内講習で使える粒度まで具体化した教材。
 * /process と同じ構成（章 → 到達目標 → 具体 → 演習）で並べる。
 *
 * 事実確認について:
 * - Codex 側のコマンド・サンドボックス・承認モードは公式ドキュメント（learn.chatgpt.com）で確認済み。
 * - Claude 側のモデルIDと料金は claude-api skill の一覧に一致させる。
 * - 両者ともバージョンで変わるため、FACT_CHECKED_ON を更新せずに内容だけ書き換えないこと。
 */

const FACT_CHECKED_ON = '2026年8月'

type Tool = {
  key: 'codex' | 'claude'
  label: string
  points: string[]
}

type Chapter = {
  id: string
  no: string
  title: string
  subtitle: string
  lead: string
  goals: string[]
  tools: Tool[]
  exercise: {
    task: string
    checks: string[]
  }
  caution?: string
}

const COMPARISON: { axis: string; codex: string; claude: string }[] = [
  {
    axis: '提供元 / 課金',
    codex: 'OpenAI。ChatGPT のプラン、または API キー',
    claude: 'Anthropic。Claude のプラン、または API キー',
  },
  {
    axis: '動かす場所',
    codex: 'ターミナル（TUI）、IDE 拡張、クラウド、ChatGPT アプリ',
    claude: 'ターミナル、デスクトップアプリ、Web（claude.ai/code）、IDE 拡張',
  },
  {
    axis: 'プロジェクト指示書',
    codex: 'AGENTS.md',
    claude: 'CLAUDE.md',
  },
  {
    axis: '設定ファイル',
    codex: '~/.codex/config.toml（プロファイルで切替）',
    claude: '.claude/settings.json（ユーザー / プロジェクト / ローカルの階層）',
  },
  {
    axis: '権限の考え方',
    codex: 'サンドボックス（できること）と承認ポリシー（聞くタイミング）を別軸で設定',
    claude: 'ツール単位の許可・拒否ルール ＋ 実行時の権限モード',
  },
  {
    axis: '非対話実行',
    codex: 'codex exec（JSONL 出力あり）',
    claude: 'claude -p（print モード）',
  },
  {
    axis: '拡張',
    codex: 'MCP サーバー、カスタムプロンプト',
    claude: 'MCP サーバー、スラッシュコマンド、Skills、サブエージェント、Hooks',
  },
  {
    axis: 'ライブラリ化',
    codex: 'クラウド API / SDK 経由',
    claude: 'Claude Agent SDK（Claude Code の中身をライブラリとして利用）',
  },
]

const CHAPTERS: Chapter[] = [
  {
    id: 'positioning',
    no: '01',
    title: '位置づけと共通モデル',
    subtitle: 'Mental Model',
    lead:
      '両者は「チャットボットにコードを書かせる道具」ではありません。リポジトリを読み、コマンドを実行し、' +
      'ファイルを編集する自律エージェントです。この違いを最初に共有しないと、権限設計の話が通じません。',
    goals: [
      '対話型LLMとコーディングエージェントの違いを説明できる',
      '「読む → 計画する → 変更する → 検証する」というループを理解している',
      '両ツールの共通点と差分を、機能名ではなく設計思想で説明できる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'ターミナルの TUI が主戦場。クラウド実行や IDE 拡張も用意されている',
          '設定を「エージェントの運用ポリシー」として扱う設計。組織単位で制約をかけられる',
          '非対話実行が第一級。CI やスクリプトへの組み込みを想定した作りになっている',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          'ターミナル・デスクトップアプリ・Web・IDE 拡張と入口が広い',
          '拡張の階層が厚い（スラッシュコマンド / Skills / サブエージェント / Hooks）',
          'Claude Agent SDK として同じ仕組みを自社アプリへ組み込める',
        ],
      },
    ],
    exercise: {
      task:
        '受講者それぞれのリポジトリで両ツールを起動し、「このリポジトリの構成を説明して」とだけ指示する。' +
        'コードは一切変更させない。',
      checks: [
        'エージェントがどのファイルを読んだかを追えたか',
        '説明が実際のコードと合っているか（合っていない箇所を1つ以上見つける）',
        '読み取りだけの操作で承認を求められたか、求められなかったか',
      ],
    },
  },
  {
    id: 'setup',
    no: '02',
    title: '導入とセットアップ',
    subtitle: 'Installation',
    lead:
      'インストール自体は数分です。時間がかかるのは認証方式と、既存プロジェクトへの初期設定の判断です。' +
      '個人のプランで入れるのか、組織の API キーで入れるのかを先に決めてください。',
    goals: [
      '両ツールをインストールし、認証を通せる',
      '個人プラン利用と API キー利用の違い（課金先・上限）を説明できる',
      'プロジェクトに初期設定を置ける',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'インストール: npm install -g @openai/codex',
          '認証: codex login（サインアウトは codex logout）',
          '設定は ~/.codex/config.toml。用途ごとにプロファイルを作り --profile で切り替える',
          'ChatGPT デスクトップアプリを開く codex app もある（macOS / Windows）',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          'ターミナルの claude コマンドのほか、デスクトップアプリ・Web・IDE 拡張から使える',
          'プロジェクト設定は .claude/settings.json、個人の上書きは settings.local.json',
          '/init を実行するとリポジトリを調べて CLAUDE.md の下書きを作る',
          'モデルはアプリの設定 UI から選択する',
        ],
      },
    ],
    exercise: {
      task:
        '講習用リポジトリで両ツールを認証まで通し、Codex は ~/.codex/config.toml に読み取り専用プロファイルを、' +
        'Claude Code は /init で CLAUDE.md を作る。',
      checks: [
        '認証情報がリポジトリに入っていないこと（git status で確認）',
        '生成された CLAUDE.md の記述が実態と合っているか読み合わせたか',
        'プロファイル指定あり・なしで挙動が変わることを確認したか',
      ],
    },
    caution:
      '認証情報やAPIキーをリポジトリへコミットしないこと。このリポジトリでは .githooks/pre-commit が ' +
      'APIキーらしき文字列と .env の追加を拒否します（有効化は git config core.hooksPath .githooks）。',
  },
  {
    id: 'permissions',
    no: '03',
    title: '権限とサンドボックス',
    subtitle: 'Permissions & Sandbox',
    lead:
      '講習で最も時間を割くべき章です。エージェントは指示を誤解します。誤解しても壊れない範囲を先に決めるのが、' +
      '生産性を上げる唯一の方法です。「全部許可」で始めると、事故が起きた日に導入そのものが止まります。',
    goals: [
      'サンドボックスと承認ポリシーが別の軸であることを説明できる',
      '作業内容に応じて適切な権限レベルを選べる',
      'ネットワークアクセスを既定で閉じる理由を説明できる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'サンドボックス（できること）は3段階: read-only / workspace-write / danger-full-access',
          '承認ポリシー（聞くタイミング）は3段階: untrusted / on-request（既定） / never',
          '指定は --sandbox と --ask-for-approval、または config.toml の sandbox_mode / approval_policy',
          'ネットワークは既定で無効。[sandbox_workspace_write] の network_access = true で開ける',
          'TUI 中は /permissions で確認・変更できる',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          '.claude/settings.json の permissions に、ツールやコマンド単位の allow / deny を書く',
          '実行時の権限モードで、確認の頻度を切り替える',
          '計画モードでは調査と計画だけを行い、承認するまで変更を加えない',
          '拒否されたツール呼び出しは「ユーザーが断った」として扱われ、勝手に再試行されない',
        ],
      },
    ],
    exercise: {
      task:
        '読み取り専用で「README を更新して」と指示し、拒否されることを確認する。' +
        '次に書き込みを許可して同じ指示を出し、差分を確認してから承認する。',
      checks: [
        '読み取り専用で本当に書き込めなかったか',
        '書き込み許可後、どのファイルが変更されたかを承認前に確認できたか',
        'ネットワークアクセスを閉じた状態で、外部への通信を伴う指示がどう失敗するか',
      ],
    },
    caution:
      'danger-full-access や全許可モードは、使い捨てのコンテナの中だけで使ってください。' +
      '手元の開発機で使うと、リポジトリ外のファイルまで変更範囲に入ります。',
  },
  {
    id: 'context',
    no: '04',
    title: 'コンテキスト設計',
    subtitle: 'AGENTS.md / CLAUDE.md',
    lead:
      'エージェントの出力品質は、渡した文脈でほぼ決まります。指示書は「プロジェクトに新しく入った人へ最初に渡す文書」' +
      'と同じものです。ただし読むのは毎回まっさらな状態の相手なので、暗黙の前提は全部書く必要があります。',
    goals: [
      '指示書に書くべきこと・書くべきでないことを判断できる',
      'コードを読めば分かることを重複して書かない理由を説明できる',
      '指示書が古びたときの症状に気づける',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'AGENTS.md をリポジトリに置くと、作業前に読み込まれる',
          '書く内容: ビルド・テストのコマンド、アーキテクチャ上の制約、パッケージマネージャの指定、触ってはいけない領域',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          'CLAUDE.md が同じ役割。/init でリポジトリを調査した下書きを作れる',
          '生成された下書きは必ず人が読み直す。調査で拾えない「なぜそうしたか」は人しか書けない',
          'ユーザー単位の記憶と、プロジェクト単位の指示書は別物として使い分ける',
        ],
      },
    ],
    exercise: {
      task:
        '自分のリポジトリの AGENTS.md / CLAUDE.md を書き、「テストを実行して結果を報告して」と指示する。' +
        'コマンドを聞き返されたら、指示書が不足している。',
      checks: [
        '聞き返されずにテストが実行できたか',
        'コードを読めば分かる内容（ディレクトリ一覧など）を書いて長くしていないか',
        '禁止事項（触ってはいけないファイル、使ってはいけないコマンド）が書かれているか',
      ],
    },
    caution:
      '指示書が実態とずれると、エージェントは自信を持って間違えます。このリポジトリでは ' +
      'docs/project-memory.md を「唯一の参照点」と定め、構成を変えたら必ず同じコミットで更新する運用にしています。',
  },
  {
    id: 'operation',
    no: '05',
    title: '基本操作とセッション',
    subtitle: 'Daily Operation',
    lead:
      '長い作業ほど、文脈が溜まって精度が落ちます。区切る・要約する・やり直す操作を最初に覚えると、' +
      '「途中から様子がおかしい」という状態を自力で立て直せるようになります。',
    goals: [
      '対話実行と非対話実行を使い分けられる',
      'セッションの再開・分岐・要約ができる',
      '一度の指示に詰め込みすぎない粒度が分かる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'codex で TUI を起動。プロンプトや画像を引数で渡せる',
          'codex resume で前のセッションを継続、codex fork で元の履歴を残したまま分岐',
          'codex exec（別名 codex e）で非対話実行。--json で JSONL、--output-last-message で最終応答を保存',
          'TUI の /diff で未追跡ファイル込みの差分、/compact で会話を要約して文脈を空ける',
          '/model でセッション途中のモデル切り替え',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          'claude で対話開始。claude -p で非対話（print）実行',
          '長くなった会話は自動で要約され、作業を続けられる',
          '計画モードで方針を固めてから実装に移る運用が有効',
          'モデルは用途で使い分ける（下の対応表を参照）',
        ],
      },
    ],
    exercise: {
      task:
        '「テストを1つ追加する」だけを指示して完了させ、次に「そのテストが落ちる実装バグを直す」を別セッションで指示する。' +
        '1回の指示で両方やらせた場合と比較する。',
      checks: [
        '分けた場合と分けなかった場合で、差分の読みやすさがどう違ったか',
        '非対話実行の出力を、そのままログとして保存できたか',
        '会話を要約した後も作業が継続できたか',
      ],
    },
  },
  {
    id: 'extension',
    no: '06',
    title: '拡張とチーム標準化',
    subtitle: 'Extension',
    lead:
      '同じ指示を毎回打ち直しているなら、それは自動化できます。ここが「個人が便利に使う」段階から' +
      '「チームの手順が揃う」段階へ移る分かれ目です。',
    goals: [
      'MCP で外部システムを安全に繋げられる',
      '繰り返す作業を再利用可能な形に落とせる',
      '拡張を入れすぎたときの弊害を説明できる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'codex mcp で MCP サーバーを管理（一覧・追加・削除・認証）',
          'TUI の /mcp で、今使えるツールとリソースを確認できる',
          'プロファイルを用途別に分け、開発用・CI用・調査用で設定を切り替える',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          'カスタムスラッシュコマンド: 定型の指示を /名前 で呼び出せる',
          'Skills: 手順書をパッケージ化し、該当する作業のときに読み込ませる',
          'サブエージェント: 調査やレビューなど、独立した文脈で走らせたい仕事を切り出す',
          'Hooks: ツール実行の前後に自前のコマンドを挟む（整形、検査、通知など）',
          'MCP サーバーで社内システムやデータベースに接続する',
        ],
      },
    ],
    exercise: {
      task:
        'チームで毎回実行している確認手順（lint → 型検査 → テスト）を1つのコマンドにまとめ、' +
        '両ツールから同じ手順で呼べるようにする。',
      checks: [
        '新しく入った人が、手順を知らなくても同じ検査を回せるか',
        '拡張を追加したことで、かえって指示が複雑になっていないか',
        'MCP 経由で渡している認証情報の管理方法を説明できるか',
      ],
    },
    caution:
      'MCP サーバーが返す内容は「データ」であって「指示」ではありません。外部から取得した文章に' +
      '書かれた命令に従わせない設計にしてください。取得元が信頼できるかどうかが、そのまま安全性になります。',
  },
  {
    id: 'review',
    no: '07',
    title: 'レビューと検証',
    subtitle: 'Review',
    lead:
      'エージェントが書いたコードをそのままマージしてはいけません。ただし人が全行を読むのも現実的ではないため、' +
      '「機械に検証させる範囲」と「人が必ず見る範囲」を分けます。',
    goals: [
      '差分レビューをエージェントに任せる範囲を決められる',
      'テストが通ったことと、正しいことの違いを説明できる',
      '生成物を検証するための仕掛けを用意できる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'codex review で、未コミットの変更・ブランチ差分・特定コミットを非対話でレビューできる',
          'CI に組み込めば、PR ごとに一次レビューを自動で回せる',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          '/code-review で現在の差分や PR をレビューする（指摘の量は効果レベルで調整）',
          '/security-review でブランチの変更にセキュリティ観点のレビューをかける',
          '指摘を PR のインラインコメントとして投稿したり、その場で修正を適用したりできる',
        ],
      },
    ],
    exercise: {
      task:
        '意図的にバグを入れた差分（境界値の誤り、N+1、権限チェック漏れなど）を用意し、' +
        '両ツールにレビューさせて検出率を比べる。',
      checks: [
        '検出できた指摘・できなかった指摘をそれぞれ記録したか',
        '誤検知（実際には問題ない指摘）がどれくらいあったか',
        '「テストが通った」だけで承認していないか',
      ],
    },
    caution:
      'エージェントは「できました」と報告しがちです。テストの実行結果、差分、実際の画面など、' +
      '検証の証拠を出させてください。証拠がない完了報告は、完了していないものとして扱います。',
  },
  {
    id: 'automation',
    no: '08',
    title: 'CI・自動化への組み込み',
    subtitle: 'Automation',
    lead:
      '非対話実行ができると、エージェントは「人が呼ぶ道具」から「パイプラインの一部」になります。' +
      'ここで効いてくるのが、03 で決めた権限設計です。無人で動くものほど、できることを絞ります。',
    goals: [
      '非対話実行をスクリプトから呼べる',
      '無人実行における権限とネットワークの設計ができる',
      '失敗したときに何を止めるかを決められる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'codex exec を CI ジョブから呼ぶ。TUI を出さずに完了する',
          '--json で JSONL のイベント列を取得し、後段の処理に渡せる',
          '--output-last-message で最終応答だけをファイルに落とせる',
          '無人実行では明示的にサンドボックスを指定する（既定に頼らない）',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          'claude -p でプロンプトを渡し、結果を標準出力で受け取る',
          'Hooks で、ツール実行の前後に検査を挟める',
          'Claude Agent SDK を使えば、同じ仕組みを自社のアプリケーションに組み込める',
        ],
      },
    ],
    exercise: {
      task:
        '「変更されたファイルに対応するテストが存在するか確認し、無ければ指摘する」処理を非対話実行で書き、' +
        'ローカルの pre-push フックから呼ぶ。',
      checks: [
        '権限を読み取り専用に絞れているか',
        '失敗時に終了コードで判別できるか',
        '実行結果がログとして残るか',
      ],
    },
    caution:
      '自動実行が push や PR 作成まで行う構成は、権限設計を終えてから段階的に。' +
      '最初は「指摘するだけ・変更しない」から始めるのが安全です。',
  },
  {
    id: 'cost',
    no: '09',
    title: 'モデル選択とコスト',
    subtitle: 'Model & Cost',
    lead:
      '常に最上位モデルを使う必要はありませんが、難しい作業で安いモデルを使うと、失敗のやり直しでかえって高くつきます。' +
      '「難しさ」で選ぶのが基本です。',
    goals: [
      '作業の難易度に応じてモデルを選べる',
      'コンテキスト長と料金の関係を説明できる',
      'トークン消費が増える要因を挙げられる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          'TUI の /model、または --model / -m フラグで切り替える',
          '利用可能なモデルは API から動的に取得される。固定の一覧を前提にしない',
          '計画・複数ファイルの編集・長いツールループを伴う作業は上位モデルを使う',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          'Claude Opus 5（claude-opus-5）— 1Mコンテキスト / 100万トークンあたり 入力$5・出力$25',
          'Claude Sonnet 5（claude-sonnet-5）— 1Mコンテキスト / 入力$3・出力$15',
          'Claude Haiku 4.5（claude-haiku-4-5）— 200Kコンテキスト / 入力$1・出力$5',
          '高速モード（/fast）は Opus 5 系で利用可能。出力が速くなる代わりに割高',
          '同じ内容を繰り返し送る用途では、プロンプトキャッシュが効くと入力コストが下がる',
        ],
      },
    ],
    exercise: {
      task:
        '同じ修正課題を、上位モデルと下位モデルの両方で実行し、所要時間・やり直し回数・最終的な差分の質を記録する。',
      checks: [
        '下位モデルで足りた作業はどれか',
        'やり直しを含めた合計で、どちらが安かったか',
        '会話が長くなるほど入力トークンが増えることを体感できたか',
      ],
    },
    caution:
      '料金とモデル構成は変わります。ここに書いた数値は' +
      FACT_CHECKED_ON +
      '時点のものです。判断に使う前に公式の料金ページで確認してください。',
  },
  {
    id: 'governance',
    no: '10',
    title: '組織導入とルール整備',
    subtitle: 'Governance',
    lead:
      '個人の生産性が上がっても、事故が1件起きれば導入は止まります。技術より先に、' +
      '「何を許可し、何を禁止するか」を文書にして合意を取ってください。',
    goals: [
      '組織として決めるべき項目を列挙できる',
      '禁止事項をツールの設定として表現できる',
      '効果測定の方法を決められる',
    ],
    tools: [
      {
        key: 'codex',
        label: 'OpenAI Codex',
        points: [
          '設定を個人の好みではなく運用ポリシーとして扱う。既定を狭く、例外を明示的に',
          'プロファイルで環境ごとの設定を分け、レビュー可能な形でリポジトリに置く',
          '重要な実行の前に、実際に効いている設定を確認する習慣をつける',
        ],
      },
      {
        key: 'claude',
        label: 'Claude Code',
        points: [
          '.claude/settings.json をリポジトリに含めてチームで共有する',
          '個人の上書きは settings.local.json に置き、共有設定と混ぜない',
          'Hooks で、組織として必須の検査を機械的に強制する',
        ],
      },
    ],
    exercise: {
      task:
        '自社向けの「コーディングエージェント利用ガイドライン」を1ページで作る。' +
        '禁止事項・承認が必要な操作・秘密情報の扱い・レビュー必須範囲を含める。',
      checks: [
        '書いた禁止事項を、ツールの設定として表現できたか',
        '例外を認める場合の承認者が決まっているか',
        '3ヶ月後に効果を測る指標を決めたか',
      ],
    },
    caution:
      '顧客のソースコードや個人情報を扱う場合は、契約上の制約とデータの取り扱い条件を先に確認してください。' +
      'ツールの設定で防げるのは技術的な事故だけです。',
  },
]

const CURRICULUM = [
  { time: '0:00–0:40', body: '01 位置づけ / 02 導入 — 環境構築まで全員そろえる' },
  { time: '0:40–1:40', body: '03 権限とサンドボックス — 最重要。演習に時間を取る' },
  { time: '1:40–2:20', body: '04 コンテキスト設計 — 自分のリポジトリで指示書を書く' },
  { time: '2:20–3:10', body: '05 基本操作 / 07 レビュー — 実際に1件の変更を通す' },
  { time: '3:10–3:50', body: '06 拡張 / 08 自動化 — チーム標準化の入口まで' },
  { time: '3:50–4:20', body: '09 コスト / 10 組織導入 — 持ち帰りの宿題を決めて終わる' },
]

const PITFALLS = [
  {
    title: '最初から全権限で始める',
    body: '事故が起きた日に導入そのものが止まります。読み取り専用から始め、必要になった権限だけ開けてください。',
  },
  {
    title: '完了報告をそのまま信じる',
    body: 'テスト結果・差分・画面など、検証の証拠を出させます。証拠のない完了報告は未完了として扱います。',
  },
  {
    title: '指示書を書かずに使い始める',
    body: '毎回同じことを聞き返されます。聞き返された内容こそ、指示書に足りていない情報です。',
  },
  {
    title: '1回の指示に詰め込む',
    body: '差分が大きくなりレビュー不能になります。1変更1指示に区切ると、失敗しても戻しやすくなります。',
  },
  {
    title: '外部から取得した文章の指示に従わせる',
    body: 'Web ページや MCP の応答は「データ」です。そこに書かれた命令を実行させない前提で設計します。',
  },
  {
    title: '指示書を更新しないまま構成を変える',
    body: 'エージェントは古い前提のまま自信を持って間違えます。構成変更と同じコミットで指示書を直します。',
  },
]

function ToolCard({ tool }: { tool: Tool }) {
  const isCodex = tool.key === 'codex'
  return (
    <div
      className={`rounded-2xl border p-5 ${
        isCodex ? 'border-emerald-200 bg-emerald-50/40' : 'border-healthcare-200 bg-healthcare-50/40'
      }`}
    >
      <h4
        className={`mb-3 text-sm font-bold ${isCodex ? 'text-emerald-800' : 'text-healthcare-800'}`}
      >
        {tool.label}
      </h4>
      <ul className="space-y-2">
        {tool.points.map((point) => (
          <li key={point} className="flex gap-2 text-sm leading-relaxed text-gray-700">
            <span
              aria-hidden="true"
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                isCodex ? 'bg-emerald-500' : 'bg-healthcare-500'
              }`}
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChapterSection({ chapter }: { chapter: Chapter }) {
  return (
    <section id={chapter.id} className="scroll-mt-28">
      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="border-b border-white/40 bg-gradient-to-r from-healthcare-50 to-white px-6 py-6 md:px-10">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-3xl font-extrabold text-healthcare-300">{chapter.no}</span>
            <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">{chapter.title}</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {chapter.subtitle}
            </span>
          </div>
          <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">{chapter.lead}</p>
        </div>

        <div className="px-6 py-6 md:px-10">
          <h3 className="mb-3 text-sm font-bold text-healthcare-700">到達目標</h3>
          <ul className="space-y-2">
            {chapter.goals.map((goal) => (
              <li key={goal} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-healthcare-400" />
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2 md:px-10">
          {chapter.tools.map((tool) => (
            <ToolCard key={tool.key} tool={tool} />
          ))}
        </div>

        <div className="border-t border-white/40 bg-white/50 px-6 py-8 md:px-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-amber/15 px-3 py-1 text-xs font-bold text-amber-700">
              演習
            </span>
            <h3 className="text-base font-bold text-gray-900">手を動かす</h3>
          </div>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-gray-700">{chapter.exercise.task}</p>
          <p className="mb-2 text-xs font-bold text-gray-500">確認すること</p>
          <ul className="space-y-2">
            {chapter.exercise.checks.map((check) => (
              <li key={check} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-amber" />
                <span>{check}</span>
              </li>
            ))}
          </ul>

          {chapter.caution && (
            <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm leading-relaxed text-rose-900">
              <span className="mr-2 font-bold">注意</span>
              {chapter.caution}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function CodingAgentsPage() {
  useEffect(() => {
    document.title = 'コーディングエージェント講習 | 須藤技術士事務所'
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
          <div className="flex items-center gap-3">
            <Link to="/process" className="hidden text-sm text-gray-700 hover:text-healthcare-600 md:inline">
              開発の進め方
            </Link>
            <Link to="/" className="btn-secondary">
              トップへ戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="py-14 md:py-20">
          <p className="mb-4 text-sm font-bold tracking-widest text-healthcare-600">CODING AGENTS</p>
          <h1 className="section-title text-3xl font-extrabold leading-tight md:text-5xl">
            OpenAI Codex と Claude Code
            <br />
            導入・運用の実務講習
          </h1>
          <p className="mt-6 max-w-3xl leading-relaxed text-gray-600">
            どちらもリポジトリを読み、コマンドを実行し、ファイルを変更する自律エージェントです。
            違いは機能の多寡ではなく、権限の与え方と拡張の考え方にあります。
            このページは、そのまま社内講習の教材として使える粒度で、10章＋演習に整理したものです。
            開発工程そのものの進め方は
            <Link
              to="/process"
              className="mx-1 font-medium text-healthcare-600 underline decoration-healthcare-300 underline-offset-2"
            >
              開発の進め方
            </Link>
            を参照してください。
          </p>
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4 text-sm leading-relaxed text-amber-900">
            <span className="mr-2 font-bold">記載時点</span>
            本ページのコマンド・設定項目・料金は{FACT_CHECKED_ON}時点で確認したものです。
            両ツールとも更新が速く、モデル構成やフラグは変わります。実務で判断に使う前に、
            それぞれの公式ドキュメントで最新の記載を確認してください。
          </div>
        </section>

        <section className="mb-10">
          <div className="glass-card rounded-3xl p-6 md:p-10">
            <h2 className="text-2xl font-extrabold text-gray-900">全体像</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              先に対応関係を押さえると、以降の章で「相手側では何にあたるか」を都度考えずに済みます。
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      観点
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-emerald-700">
                      OpenAI Codex
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-healthcare-700">
                      Claude Code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.axis}>
                      <td className="border-b border-gray-100 px-3 py-3 align-top font-medium text-gray-900">
                        {row.axis}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-3 align-top leading-relaxed text-gray-700">
                        {row.codex}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-3 align-top leading-relaxed text-gray-700">
                        {row.claude}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <nav aria-label="章一覧" className="glass-card rounded-3xl p-6 md:p-8">
          <p className="mb-4 text-sm font-bold text-gray-500">章一覧</p>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((chapter) => (
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

        <div className="mt-10 space-y-10">
          {CHAPTERS.map((chapter) => (
            <ChapterSection key={chapter.id} chapter={chapter} />
          ))}
        </div>

        <section className="mt-16">
          <div className="glass-card rounded-3xl p-6 md:p-10">
            <h2 className="text-2xl font-extrabold text-gray-900">よくある失敗</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              導入がうまくいかない現場は、たいてい次のどれかに当てはまります。講習の締めで必ず共有してください。
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {PITFALLS.map((pitfall) => (
                <div key={pitfall.title} className="rounded-2xl bg-white/60 px-5 py-4">
                  <h3 className="mb-2 text-sm font-bold text-rose-800">{pitfall.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-700">{pitfall.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="glass-card rounded-3xl p-6 md:p-10">
            <h2 className="text-2xl font-extrabold text-gray-900">半日講習の進行例</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              4時間半で全10章を扱う場合の配分です。03 の権限設計に最も時間を割きます。
              受講者は自分のリポジトリを持参し、演習はそこで行ってください。
            </p>
            <ul className="mt-6 space-y-3">
              {CURRICULUM.map((slot) => (
                <li
                  key={slot.time}
                  className="flex flex-col gap-1 rounded-2xl bg-white/60 px-5 py-3 sm:flex-row sm:items-baseline sm:gap-5"
                >
                  <span className="shrink-0 font-mono text-sm font-bold text-healthcare-600">{slot.time}</span>
                  <span className="text-sm leading-relaxed text-gray-700">{slot.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <div className="glass-card rounded-3xl p-6 text-center md:p-10">
            <h2 className="text-xl font-extrabold text-gray-900 md:text-2xl">
              社内向けの講習・導入支援を承ります
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
              受講者の環境やリポジトリに合わせて内容を調整します。
              権限設計やガイドライン整備だけを切り出した相談も可能です。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/" className="btn-gradient">
                トップページへ
              </Link>
              <Link to="/process" className="btn-secondary">
                開発の進め方を見る
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
