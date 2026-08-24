/**
 * React + Next.js + TypeScript 開発マニュアルの本文
 *
 * 画面（pages/ReactManualPage.tsx）は並べるだけで、内容はここに集約する。
 * 実装中に引く資料なので「何ができるか」ではなく「どう書くか・なぜそう書くか」を書く。
 *
 * 節には id を振ってある。/react-manual#hooks-deps のように直接指せるので、
 * レビューや作業指示では章ではなく節の URL を渡すこと。
 *
 * 前提バージョンは MANUAL_VERSIONS に置いた。上げたら該当節を必ず見直す。
 */

export type Block =
  | { kind: 'text'; body: string }
  | { kind: 'list'; title?: string; items: string[] }
  | { kind: 'code'; label: string; code: string[] }
  | { kind: 'compare'; bad: { label: string; code: string[] }; good: { label: string; code: string[] } }
  | { kind: 'note'; tone: 'warn' | 'tip'; title: string; body: string }
  | { kind: 'table'; head: string[]; rows: string[][] }

export type Section = {
  id: string
  title: string
  lead: string
  blocks: Block[]
}

export type Chapter = {
  id: string
  no: string
  title: string
  subtitle: string
  summary: string
  sections: Section[]
}

export const MANUAL_VERSIONS = [
  { name: 'React', version: '19.x', note: 'Server Components / Actions / use() が前提' },
  { name: 'Next.js', version: '15.x', note: 'App Router。params と searchParams は Promise' },
  { name: 'TypeScript', version: '5.x', note: 'strict は必須。verbatimModuleSyntax を推奨' },
  { name: 'Node.js', version: '20 LTS 以上', note: 'Next.js 15 は Node 18.18 未満では動かない' },
]

export const CHAPTERS: Chapter[] = [
  {
    id: 'setup',
    no: '01',
    title: 'セットアップ',
    subtitle: 'Setup',
    summary: '最初に決めた設定は後から直すほど高くつく。型の厳しさとディレクトリの切り方をここで固定する。',
    sections: [
      {
        id: 'setup-create',
        title: 'プロジェクトを作る',
        lead:
          'テンプレートは create-next-app に任せる。手で組むと tsconfig の paths や next-env.d.ts の扱いを' +
          '間違えやすく、得るものがない。',
        blocks: [
          {
            kind: 'code',
            label: 'ターミナル',
            code: [
              'npx create-next-app@latest my-app \\',
              '  --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"',
              '',
              'cd my-app',
              'npm run dev        # http://localhost:3000',
              'npm run build      # 本番ビルド。型エラーもここで落ちる',
              'npx tsc --noEmit   # 型だけを確認する。CI では別ステップに分ける',
            ],
          },
          {
            kind: 'list',
            title: 'このオプションを選ぶ理由',
            items: [
              '--app : Pages Router を新規で選ぶ理由はない。ただし検索で出る記事は両方混在するので、どちらの話かを毎回確認すること',
              '--src-dir : アプリのコードと設定ファイルが混ざらない。app/ が育ったときに効く',
              '--import-alias : 相対パスの ../../../ を消す。ファイル移動に強くなる',
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'Pages Router の記事を読むときの見分け方',
            body:
              'getServerSideProps / getStaticProps / _app.tsx / next/router が出てきたら Pages Router の記事。' +
              'App Router には存在しない。App Router 側は app/ ディレクトリ・layout.tsx・next/navigation を使う。',
          },
        ],
      },
      {
        id: 'setup-tsconfig',
        title: 'tsconfig.json — 最初に締める',
        lead:
          '型の厳しさは後から上げるほど直す量が増える。コードが空のうちに一番厳しくしておく。' +
          '既存プロジェクトで一気に有効化できないときは strict だけ先に入れ、残りは段階的に。',
        blocks: [
          {
            kind: 'code',
            label: 'tsconfig.json（compilerOptions の要点）',
            code: [
              '{',
              '  "compilerOptions": {',
              '    "strict": true,                       // これが本体。個別フラグより先に',
              '    "noUncheckedIndexedAccess": true,     // arr[0] を T | undefined にする',
              '    "noImplicitOverride": true,',
              '    "noFallthroughCasesInSwitch": true,',
              '    "exactOptionalPropertyTypes": true,   // 省略と undefined 明示を区別する',
              '    "verbatimModuleSyntax": true,         // import type の付け忘れを検出',
              '    "moduleResolution": "bundler",',
              '    "paths": { "@/*": ["./src/*"] }',
              '  }',
              '}',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'next build は型エラーを黙らせられてしまう',
            body:
              'next.config の typescript.ignoreBuildErrors と eslint.ignoreDuringBuilds は true にしない。' +
              '一度入れると型が壊れたまま本番へ出る。どうしても急ぐときは該当行に @ts-expect-error を書き、' +
              '理由をコメントに残す。@ts-ignore ではなく @ts-expect-error を使うこと（不要になったとき逆に警告が出て、消し忘れない）。',
          },
        ],
      },
      {
        id: 'setup-structure',
        title: 'ディレクトリの切り方',
        lead:
          '機能で切る。種類（components / hooks / utils）で切ると、機能をひとつ消すときに' +
          '全ディレクトリを横断して残骸を探すことになる。共有物だけを種類で切る。',
        blocks: [
          {
            kind: 'code',
            label: 'src/ の構成',
            code: [
              'src/',
              '  app/                     # ルーティング。画面の組み立てだけ置く',
              '    layout.tsx',
              '    page.tsx',
              '    (marketing)/           # ルートグループ。URL には出ない',
              '    appointments/',
              '      page.tsx',
              '      actions.ts           # その画面用の Server Actions',
              '  features/                # 機能単位。実装の本体はここ',
              '    appointment/',
              '      components/',
              '      hooks/',
              '      api.ts',
              '      schema.ts            # zod スキーマ。型の定義元',
              '  components/ui/           # 機能に依存しない部品だけ',
              '  lib/                     # fetch ラッパ・日付・env など',
              '  types/                   # 複数機能で共有する型のみ',
            ],
          },
          {
            kind: 'list',
            title: '判断の基準',
            items: [
              '2 つ以上の機能から使われて初めて components/ui へ上げる。先回りして共通化しない',
              'app/ 配下のファイルは並べるだけ。ロジックが 30 行を超えたら features/ へ出す',
              '型の定義元は 1 箇所。zod スキーマがあるならスキーマが定義元で、型は z.infer で導く',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'typescript',
    no: '02',
    title: 'TypeScript の型付け',
    subtitle: 'TypeScript',
    summary: '型は「正しく動く保証」ではなく「壊れたとき気づく仕掛け」。境界に厚く、内側は薄く。',
    sections: [
      {
        id: 'ts-props',
        title: 'Props の型',
        lead:
          'type と interface はどちらでもよいがプロジェクト内で統一する。React.FC は使わない。' +
          'children が暗黙で入り、ジェネリクスも書きにくいため。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '避ける',
              code: [
                'const Card: React.FC<{ title: string }> = ({ title, children }) => {',
                '  // children が型に書かれていないのに使える = 意図が読めない',
                '  return <div>{title}{children}</div>',
                '}',
              ],
            },
            good: {
              label: '推奨',
              code: [
                'type CardProps = {',
                '  title: string',
                '  tone?: "default" | "warning"    // string ではなくリテラル union',
                '  children?: React.ReactNode       // 使うなら明示する',
                '}',
                '',
                'export function Card({ title, tone = "default", children }: CardProps) {',
                '  return <div data-tone={tone}>{title}{children}</div>',
                '}',
              ],
            },
          },
          {
            kind: 'code',
            label: 'DOM 要素を拡張する部品',
            code: [
              '// button の属性をすべて受け取りつつ、独自の variant を足す',
              'type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {',
              '  variant?: "primary" | "secondary"',
              '}',
              '',
              'export function Button({ variant = "primary", className, ...rest }: ButtonProps) {',
              '  return <button className={`btn-${variant} ${className ?? ""}`} {...rest} />',
              '}',
              '',
              '// React 19 では forwardRef は不要。ref が通常の prop になった',
              'type InputProps = React.ComponentPropsWithRef<"input">',
              'export function Input({ ref, ...rest }: InputProps) {',
              '  return <input ref={ref} {...rest} />',
              '}',
            ],
          },
        ],
      },
      {
        id: 'ts-modeling',
        title: 'あり得ない状態を型で消す',
        lead:
          'boolean を並べると、その組み合わせの数だけ存在しない状態が生まれる。' +
          'union にすれば、あり得ない組み合わせはそもそも書けなくなる。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '避ける — 8 通りのうち 5 通りは無意味',
              code: [
                'type State = {',
                '  isLoading: boolean',
                '  error: string | null',
                '  data: User | null',
                '}',
                '// isLoading と error と data が同時に立ち得てしまう',
              ],
            },
            good: {
              label: '推奨 — 判別可能 union',
              code: [
                'type State =',
                '  | { status: "idle" }',
                '  | { status: "loading" }',
                '  | { status: "error"; message: string }',
                '  | { status: "success"; data: User }',
                '',
                'if (state.status === "success") {',
                '  state.data.name   // ここでは data が必ずある',
                '}',
              ],
            },
          },
          {
            kind: 'code',
            label: '網羅性を強制する',
            code: [
              'function assertNever(value: never): never {',
              '  throw new Error(`未処理のケース: ${JSON.stringify(value)}`)',
              '}',
              '',
              'switch (state.status) {',
              '  case "idle": return null',
              '  case "loading": return <Spinner />',
              '  case "error": return <Alert message={state.message} />',
              '  case "success": return <List data={state.data} />',
              '  default: return assertNever(state)   // ケースを足し忘れると型エラー',
              '}',
            ],
          },
        ],
      },
      {
        id: 'ts-boundary',
        title: '外から来る値は as ではなく検証する',
        lead:
          'API レスポンス・フォーム入力・環境変数・localStorage。これらに as で型を付けるのは嘘をつくのと同じで、' +
          '壊れたときは画面の奥で undefined として現れる。境界で検証する。',
        blocks: [
          {
            kind: 'code',
            label: 'zod をスキーマの定義元にする',
            code: [
              'import { z } from "zod"',
              '',
              'export const userSchema = z.object({',
              '  id: z.string().uuid(),',
              '  email: z.string().email(),',
              '  displayName: z.string().min(1).max(50),',
              '  role: z.enum(["admin", "member"]),',
              '  createdAt: z.coerce.date(),',
              '})',
              '',
              '// 型はスキーマから導く。手書きの type と二重管理しない',
              'export type User = z.infer<typeof userSchema>',
              '',
              'export async function fetchUser(id: string): Promise<User> {',
              '  const res = await fetch(`${process.env.API_URL}/users/${id}`)',
              '  if (!res.ok) throw new Error(`GET /users/${id} が ${res.status} を返した`)',
              '  return userSchema.parse(await res.json())   // ここで形が保証される',
              '}',
            ],
          },
          {
            kind: 'code',
            label: '環境変数も起動時に検証する',
            code: [
              '// src/lib/env.ts — import された時点で落ちる。本番で気づくより早い',
              'const envSchema = z.object({',
              '  DATABASE_URL: z.string().url(),',
              '  API_URL: z.string().url(),',
              '  NEXT_PUBLIC_SITE_URL: z.string().url(),',
              '})',
              '',
              'export const env = envSchema.parse(process.env)',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'NEXT_PUBLIC_ が付いた変数はブラウザに埋め込まれる',
            body:
              'ビルド時にバンドルへ文字列として展開される。API キー・DB 接続情報・管理者メールを NEXT_PUBLIC_ で' +
              '渡してはいけない。誰でも DevTools から読める。サーバー側でしか使わない値は接頭辞を付けず、' +
              'Client Component から import しないこと。',
          },
        ],
      },
      {
        id: 'ts-utility',
        title: 'よく使うユーティリティ型',
        lead: '毎回考え直さずに済むよう、使いどころを固定しておく。',
        blocks: [
          {
            kind: 'table',
            head: ['型', '意味', '典型的な使いどころ'],
            rows: [
              ['Pick<T, K>', 'T から K だけ抜く', '一覧表示用の軽い型を作る'],
              ['Omit<T, K>', 'T から K を除く', 'id を除いた作成用の入力型'],
              ['Partial<T>', 'すべて省略可にする', '更新 API の入力。乱用すると必須が消えるので範囲を絞る'],
              ['Required<T>', 'すべて必須にする', '既定値を埋めたあとの内部型'],
              ['Readonly<T>', '再代入を禁止する', 'props をそのまま持ち回すとき'],
              ['Record<K, V>', 'キー K・値 V の辞書', 'ラベル定義。union をキーにすると定義漏れを検出できる'],
              ['Awaited<T>', 'Promise を剥がす', 'async 関数の戻り値から型を取る'],
              ['NonNullable<T>', 'null / undefined を除く', 'フィルタ後の配列要素'],
              ['z.infer<T>', 'zod スキーマから型を導く', 'API・フォームの型はすべてこれ'],
            ],
          },
          {
            kind: 'code',
            label: 'Record で定義漏れを防ぐ / satisfies で推論を保つ',
            code: [
              'type Role = "admin" | "member" | "guest"',
              '',
              '// Role を増やしたとき、ここに足さないと型エラーになる',
              'const ROLE_LABELS: Record<Role, string> = {',
              '  admin: "管理者",',
              '  member: "一般",',
              '  guest: "ゲスト",',
              '}',
              '',
              '// satisfies は「型に合っているか検査しつつ、実際の型は保つ」',
              'const CONFIG = {',
              '  retry: 3,',
              '  endpoints: ["/a", "/b"],',
              '} satisfies { retry: number; endpoints: readonly string[] }',
              '// CONFIG.endpoints は string[] に潰れず実体のまま推論される',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'components',
    no: '03',
    title: 'コンポーネント設計',
    subtitle: 'Components',
    summary: '再利用のためではなく、読める単位に切るために分ける。props が増えたら分け方を間違えている。',
    sections: [
      {
        id: 'comp-split',
        title: 'どこで切るか',
        lead:
          '「同じ見た目だから共通化する」ではなく「同じ理由で変わるから同じ場所に置く」。' +
          '見た目が似ているだけの 2 つを 1 つにすると、片方の変更のたびに分岐が増える。',
        blocks: [
          {
            kind: 'list',
            title: '分けるべきサイン',
            items: [
              'JSX が画面 1 つぶんを超えてスクロールしないと読めない',
              '1 つのコンポーネントに無関係な useState が 4 つ以上ある',
              'props に isXxx が 3 つ以上並び、その組み合わせで見た目が決まっている',
              '早期 return が 5 個以上あり、それぞれ別物を返している',
            ],
          },
          {
            kind: 'list',
            title: '分けてはいけないサイン',
            items: [
              '親から渡す props が、切り出した中身とほぼ同じ数になる（切っても読みやすくならない）',
              '切った先を他から呼ぶ予定がなく、親でしか意味を持たない 10 行',
              '「いつか使うかもしれない」だけを根拠にした汎用化',
            ],
          },
        ],
      },
      {
        id: 'comp-composition',
        title: 'props を増やさず children で組む',
        lead:
          '設定用の props を足し続けると、そのコンポーネントは分岐の塊になる。' +
          '構造を外から渡せば、中身は薄いままでいられる。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '避ける — 設定 props が増え続ける',
              code: [
                '<Modal',
                '  title="予約"',
                '  showIcon',
                '  iconName="calendar"',
                '  footerButtonLabel="送信"',
                '  footerButtonVariant="primary"',
                '  hideCloseButton={false}',
                '/>',
              ],
            },
            good: {
              label: '推奨 — 構造を渡す',
              code: [
                '<Modal onClose={close}>',
                '  <Modal.Header icon={<CalendarIcon />}>予約</Modal.Header>',
                '  <Modal.Body>{form}</Modal.Body>',
                '  <Modal.Footer>',
                '    <Button variant="primary">送信</Button>',
                '  </Modal.Footer>',
                '</Modal>',
              ],
            },
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'children はバケツリレー対策にもなる',
            body:
              '深い階層へ props を渡すために中間コンポーネントが受け取るだけの props を持っているなら、' +
              'その中間層に children を取らせて、要素そのものを上から渡す。Context を増やす前にこれを試す。',
          },
        ],
      },
      {
        id: 'comp-keys',
        title: 'key と再レンダリング',
        lead:
          'key は「同じものか」を React に伝える識別子。index を渡すと、並び替え・削除のときに' +
          '別の要素の state が引き継がれる。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '避ける',
              code: [
                '{items.map((item, i) => (',
                '  <Row key={i} item={item} />',
                '))}',
                '// 先頭を削除すると、2 番目の入力値が 1 番目に残る',
              ],
            },
            good: {
              label: '推奨',
              code: [
                '{items.map((item) => (',
                '  <Row key={item.id} item={item} />',
                '))}',
                '',
                '// key を意図的に変えて state をリセットするのは正しい使い方',
                '<EditForm key={selectedId} defaultValues={selected} />',
              ],
            },
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'props が変わったら state を作り直す、を useEffect でやらない',
            body:
              'useEffect で props を state へ同期すると、一度古い値で描画してから上書きするため画面がちらつく。' +
              'key を変えてコンポーネントごと作り直すか、そもそも state にせず props から算出する。',
          },
        ],
      },
    ],
  },
  {
    id: 'hooks',
    no: '04',
    title: 'フック',
    subtitle: 'Hooks',
    summary: 'React の不具合はほとんどここに集まる。特に useEffect は「使わない判断」が先。',
    sections: [
      {
        id: 'hooks-list',
        title: '主なフックの使い分け',
        lead: '迷ったらこの表に戻る。',
        blocks: [
          {
            kind: 'table',
            head: ['フック', '用途', '注意'],
            rows: [
              ['useState', '再描画が必要な値', '他の state から計算できる値は持たない'],
              ['useReducer', '複数の値が連動して変わる', '状態遷移が 3 つ以上なら useState より読みやすい'],
              ['useEffect', '外部システムとの同期', 'データ変換・イベント処理には使わない'],
              ['useMemo', '重い計算の結果を保つ', '計測してから入れる。既定では入れない'],
              ['useCallback', '関数の同一性を保つ', 'memo 化した子・依存配列に渡すときだけ'],
              ['useRef', '再描画不要な値・DOM 参照', '変更しても再描画されない'],
              ['useContext', '深い階層への受け渡し', '値が変わると購読側が全部再描画される'],
              ['useTransition', '重い更新を後回しにする', '入力の応答性を保つ'],
              ['useActionState', 'フォーム送信の状態', 'React 19。Server Actions と組む'],
              ['useOptimistic', '送信中に結果を先に見せる', '失敗時は自動で巻き戻る'],
              ['use()', 'Promise / Context を読む', '条件分岐の中でも呼べる例外的な API'],
            ],
          },
        ],
      },
      {
        id: 'hooks-no-effect',
        title: 'useEffect を使わない判断',
        lead:
          'useEffect は「React の外側と同期する」ための出口であって、処理を順番に書くための道具ではない。' +
          '大半の useEffect は消せる。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '避ける — 派生値を state にしている',
              code: [
                'const [items, setItems] = useState<Item[]>([])',
                'const [total, setTotal] = useState(0)',
                '',
                'useEffect(() => {',
                '  setTotal(items.reduce((a, b) => a + b.price, 0))',
                '}, [items])',
                '// 一度古い total で描画されてから、もう一度描画される',
              ],
            },
            good: {
              label: '推奨 — 描画のたびに算出する',
              code: [
                'const [items, setItems] = useState<Item[]>([])',
                'const total = items.reduce((a, b) => a + b.price, 0)',
                '',
                '// 本当に重いと計測できたときだけ',
                '// const total = useMemo(() => heavy(items), [items])',
              ],
            },
          },
          {
            kind: 'list',
            title: 'useEffect が要らないケース',
            items: [
              '他の state / props から計算できる値 → その場で算出する',
              'ボタンを押したときの処理 → イベントハンドラに書く',
              'props が変わったら state を初期化したい → key を変える',
              'サーバーからのデータ取得 → Server Component か TanStack Query に任せる',
            ],
          },
          {
            kind: 'list',
            title: 'useEffect が正しいケース',
            items: [
              'addEventListener / setInterval / WebSocket など、React の外側の購読',
              'ブラウザ API（document.title・IntersectionObserver・matchMedia）の操作',
              'サードパーティのライブラリインスタンスの生成と破棄',
            ],
          },
        ],
      },
      {
        id: 'hooks-deps',
        title: '依存配列とクリーンアップ',
        lead:
          '依存配列は「これが変わったら実行し直す」の宣言。lint の警告を消すために依存を削るのは、' +
          '古い値を掴んだままにする近道になる。',
        blocks: [
          {
            kind: 'code',
            label: '購読は必ず解除する',
            code: [
              'useEffect(() => {',
              '  const onResize = () => setWidth(window.innerWidth)',
              '  window.addEventListener("resize", onResize)',
              '  return () => window.removeEventListener("resize", onResize)',
              '}, [])   // 購読対象が変わらないので空でよい',
            ],
          },
          {
            kind: 'code',
            label: '非同期処理は捨てられるようにする',
            code: [
              'useEffect(() => {',
              '  const controller = new AbortController()',
              '',
              '  fetch(`/api/users/${id}`, { signal: controller.signal })',
              '    .then((r) => r.json())',
              '    .then(setUser)',
              '    .catch((e) => {',
              '      if (e.name !== "AbortError") setError(e)',
              '    })',
              '',
              '  return () => controller.abort()   // id が変わる / 画面を離れる',
              '}, [id])',
              '// これがないと、遅れて返った古いリクエストが新しい結果を上書きする',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: '開発時に useEffect が 2 回走るのは仕様',
            body:
              'React の Strict Mode は開発時だけ意図的に effect をマウント→アンマウント→マウントする。' +
              'クリーンアップが正しく書けていれば問題は出ない。2 回走るのが困るなら、それは' +
              'クリーンアップが足りていない合図で、Strict Mode を切って隠す話ではない。',
          },
        ],
      },
      {
        id: 'hooks-custom',
        title: 'カスタムフック',
        lead:
          '共通化のためではなく、状態と副作用の組を名前で呼べるようにするために作る。' +
          'JSX を返したくなったらそれはコンポーネント。',
        blocks: [
          {
            kind: 'code',
            label: 'src/features/appointment/hooks/useDebouncedValue.ts',
            code: [
              'export function useDebouncedValue<T>(value: T, delayMs = 300): T {',
              '  const [debounced, setDebounced] = useState(value)',
              '',
              '  useEffect(() => {',
              '    const timer = setTimeout(() => setDebounced(value), delayMs)',
              '    return () => clearTimeout(timer)',
              '  }, [value, delayMs])',
              '',
              '  return debounced',
              '}',
              '',
              '// 使う側',
              'const query = useDebouncedValue(input, 300)',
            ],
          },
          {
            kind: 'list',
            title: '守ること',
            items: [
              '名前は use で始める。lint のルールがこれで効く',
              '条件分岐・ループ・早期 return の後ろでフックを呼ばない（呼ぶ順番が毎回同じでなければならない）',
              '戻り値は 3 つ以上ならオブジェクトにする。配列は useState 風の 2 つまで',
              '中で fetch するフックを量産しない。サーバー状態は TanStack Query か Server Component へ寄せる',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'routing',
    no: '05',
    title: 'App Router',
    subtitle: 'Routing',
    summary: 'ファイル名が仕様。特別なファイルの役割を覚えれば、ルーティングの設定ファイルは要らない。',
    sections: [
      {
        id: 'routing-files',
        title: '特別なファイル',
        lead: 'app/ 配下でこれらの名前は予約されている。',
        blocks: [
          {
            kind: 'table',
            head: ['ファイル', '役割', '備考'],
            rows: [
              ['page.tsx', 'その URL の画面', 'これがないと URL として到達できない'],
              ['layout.tsx', '配下で共有する枠', '遷移しても再マウントされない。state が保たれる'],
              ['template.tsx', 'layout と同じ位置で毎回再マウント', '遷移ごとにアニメを走らせたいとき'],
              ['loading.tsx', '読み込み中の表示', '自動で Suspense 境界になる'],
              ['error.tsx', 'エラー時の表示', 'Client Component 必須。reset() で再試行'],
              ['not-found.tsx', '404 の表示', 'notFound() を呼ぶと出る'],
              ['route.ts', 'API エンドポイント', 'GET / POST を export する。page.tsx とは同居できない'],
              ['default.tsx', 'パラレルルートの既定', '@slot と組で使う'],
            ],
          },
          {
            kind: 'code',
            label: 'ディレクトリと URL の対応',
            code: [
              'app/layout.tsx                 → 全ページ共通の枠（html / body はここだけ）',
              'app/page.tsx                   → /',
              'app/(marketing)/about/page.tsx → /about        ※ (marketing) は URL に出ない',
              'app/blog/[slug]/page.tsx       → /blog/hello',
              'app/shop/[...path]/page.tsx    → /shop/a/b/c   ※ catch-all',
              'app/shop/[[...path]]/page.tsx  → /shop も含む  ※ optional catch-all',
              'app/_internal/util.ts          → URL にならない（_ 始まりは private）',
              'app/api/health/route.ts        → /api/health',
            ],
          },
        ],
      },
      {
        id: 'routing-params',
        title: 'params と searchParams は Promise',
        lead:
          'Next.js 15 でここが変わった。await せずにプロパティへ触ると実行時に警告か失敗になる。' +
          '古い記事のコードをそのまま貼ると必ずここで詰まる。',
        blocks: [
          {
            kind: 'code',
            label: 'app/blog/[slug]/page.tsx',
            code: [
              'type Props = {',
              '  params: Promise<{ slug: string }>',
              '  searchParams: Promise<{ [key: string]: string | string[] | undefined }>',
              '}',
              '',
              'export default async function BlogPage({ params, searchParams }: Props) {',
              '  const { slug } = await params',
              '  const { page } = await searchParams',
              '',
              '  const post = await getPost(slug)',
              '  if (!post) notFound()',
              '',
              '  return <Article post={post} page={Number(page ?? 1)} />',
              '}',
              '',
              '// メタデータも同じ形',
              'export async function generateMetadata({ params }: Props): Promise<Metadata> {',
              '  const { slug } = await params',
              '  const post = await getPost(slug)',
              '  return { title: post?.title ?? "記事が見つかりません" }',
              '}',
            ],
          },
          {
            kind: 'code',
            label: 'ビルド時に静的化する（SSG）',
            code: [
              'export async function generateStaticParams() {',
              '  const posts = await getAllPosts()',
              '  return posts.map((p) => ({ slug: p.slug }))',
              '}',
              '',
              '// 一覧にない slug が来たときの扱い',
              'export const dynamicParams = true   // false なら 404',
            ],
          },
        ],
      },
      {
        id: 'routing-navigation',
        title: '遷移と現在地',
        lead:
          'import 元を間違えやすい。App Router では next/navigation、next/router は Pages Router のもの。',
        blocks: [
          {
            kind: 'code',
            label: 'Client Component 側',
            code: [
              '"use client"',
              'import Link from "next/link"',
              'import { useRouter, usePathname, useSearchParams } from "next/navigation"',
              '',
              'export function Nav() {',
              '  const router = useRouter()',
              '  const pathname = usePathname()',
              '  const searchParams = useSearchParams()',
              '',
              '  return (',
              '    <>',
              '      <Link href="/about" prefetch>会社概要</Link>',
              '      <button onClick={() => router.push("/contact")}>問い合わせ</button>',
              '      <button onClick={() => router.refresh()}>再取得</button>',
              '      <span>{pathname} / {searchParams.get("tab")}</span>',
              '    </>',
              '  )',
              '}',
            ],
          },
          {
            kind: 'code',
            label: 'Server Component 側',
            code: [
              'import { redirect, notFound } from "next/navigation"',
              '',
              'const user = await getCurrentUser()',
              'if (!user) redirect("/login")        // 302',
              'if (!user.canView) notFound()        // 404（not-found.tsx が出る）',
              '',
              '// redirect / notFound は内部で例外を投げて処理を打ち切る。',
              '// try / catch の中で呼ぶと握り潰されるので注意。',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'useSearchParams は Suspense で囲む',
            body:
              '静的化されたページで useSearchParams を使うと、ビルド時に「Suspense 境界がない」と' +
              'エラーになる。使う側を小さな Client Component に切り出し、<Suspense> で包むこと。',
          },
        ],
      },
      {
        id: 'routing-error',
        title: 'loading.tsx と error.tsx',
        lead:
          '置くだけで効く。ただし error.tsx はそのセグメント配下しか受け止めない。' +
          'layout.tsx 自身のエラーは、同じ階層の error.tsx では捕まらない。',
        blocks: [
          {
            kind: 'code',
            label: 'app/appointments/error.tsx',
            code: [
              '"use client"   // error.tsx は必ず Client Component',
              '',
              'export default function Error({',
              '  error,',
              '  reset,',
              '}: {',
              '  error: Error & { digest?: string }',
              '  reset: () => void',
              '}) {',
              '  useEffect(() => {',
              '    // 本番ではメッセージが隠され digest だけが渡る。監視へはこれを送る',
              '    console.error(error)',
              '  }, [error])',
              '',
              '  return (',
              '    <div>',
              '      <p>読み込みに失敗しました。</p>',
              '      <button onClick={reset}>再試行</button>',
              '    </div>',
              '  )',
              '}',
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'layout のエラーを受けたいときは global-error.tsx',
            body:
              'ルート layout ごと落ちたときに出るのは app/global-error.tsx。' +
              'html と body タグを自前で書く必要がある（壊れた layout を使えないため）。本番でのみ有効。',
          },
        ],
      },
    ],
  },
  {
    id: 'rendering',
    no: '06',
    title: 'Server / Client の境界',
    subtitle: 'Rendering',
    summary: 'App Router で最初に躓く場所。既定はサーバー。"use client" は必要な葉にだけ置く。',
    sections: [
      {
        id: 'rsc-basics',
        title: '既定は Server Component',
        lead:
          'app/ 配下は何も書かなければサーバーで実行され、JS はブラウザへ送られない。' +
          '"use client" を書いた時点で、そのファイルと、そこから import する木がバンドルに乗る。',
        blocks: [
          {
            kind: 'table',
            head: ['できること', 'Server Component', 'Client Component'],
            rows: [
              ['async / await でデータ取得', '○', '× （use() 経由なら可）'],
              ['DB・秘密鍵へのアクセス', '○', '× 絶対に置かない'],
              ['useState / useEffect', '×', '○'],
              ['onClick などのイベント', '×', '○'],
              ['ブラウザ API（window 等）', '×', '○'],
              ['バンドルサイズへの影響', 'なし', 'あり'],
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: '"use client" はファイルの先頭 1 行目に書く',
            body:
              'コメントより上、import より上。位置がずれると効かない。' +
              'また、Client Component から import されたファイルは、"use client" を書いていなくても' +
              'クライアント側の扱いになる。サーバー専用モジュールには import "server-only" を入れて、' +
              '誤って client 側へ引き込んだらビルドで落とす。',
          },
        ],
      },
      {
        id: 'rsc-boundary',
        title: '境界の引き方',
        lead:
          '「対話が必要な部分」だけを Client にする。ページ全体に "use client" を書くと、' +
          'App Router を使う意味がほぼ消える。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '避ける — ページごと Client 化',
              code: [
                '"use client"',
                '',
                'export default function Page() {',
                '  const [open, setOpen] = useState(false)',
                '  const { data } = useSWR("/api/posts")   // 表示まで待たされる',
                '  return <>...</>',
                '}',
              ],
            },
            good: {
              label: '推奨 — 取得はサーバー、対話だけ Client',
              code: [
                '// app/posts/page.tsx（Server Component）',
                'export default async function Page() {',
                '  const posts = await getPosts()          // JS を送らずに取得',
                '  return (',
                '    <>',
                '      <PostList posts={posts} />          // 表示だけならサーバーのまま',
                '      <NewPostButton />                   // "use client" はこの中だけ',
                '    </>',
                '  )',
                '}',
              ],
            },
          },
          {
            kind: 'code',
            label: 'Client の内側にサーバーの内容を差し込む',
            code: [
              '// Client Component は children としてなら Server Component を受け取れる',
              '// （props として「すでに描画された結果」を受け取る形になるため）',
              '',
              '// app/page.tsx（Server）',
              '<Accordion>            {/* "use client" */}',
              '  <ServerChart />      {/* Server のまま中に入る */}',
              '</Accordion>',
              '',
              '// これができないパターン：Client の中で import して直接呼ぶ',
              '// import ServerChart from "./ServerChart"  ← Client 扱いになる',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'Server から Client へ渡せる props は制限がある',
            body:
              'シリアライズできる値だけ。関数・クラスインスタンス・Date 以外の複雑なオブジェクト・Symbol は渡せない。' +
              '関数を渡したい場合は Server Action（"use server" が付いた関数）にする。',
          },
        ],
      },
      {
        id: 'rsc-hydration',
        title: 'Hydration エラーの潰し方',
        lead:
          'サーバーが出した HTML とブラウザの最初の描画が食い違うと出る。原因はほぼ決まっている。',
        blocks: [
          {
            kind: 'list',
            title: 'よくある原因',
            items: [
              'new Date() / Math.random() / crypto.randomUUID() を描画中に呼んでいる',
              'localStorage・window・navigator を描画中に読んでいる',
              'ブラウザ拡張が body に属性を挿している（この場合は無視してよい）',
              '<p> の中に <div> を入れているなど、ブラウザが勝手に直す不正な HTML 構造',
            ],
          },
          {
            kind: 'code',
            label: '「ブラウザでしか決まらない値」の扱い',
            code: [
              '"use client"',
              '',
              'export function LocalTime({ iso }: { iso: string }) {',
              '  const [text, setText] = useState<string | null>(null)',
              '',
              '  // 初回描画では出さない。マウント後に埋める',
              '  useEffect(() => {',
              '    setText(new Date(iso).toLocaleString("ja-JP"))',
              '  }, [iso])',
              '',
              '  // suppressHydrationWarning は「時刻表示だけ」など、',
              '  // 差分が出るのが分かっている 1 要素に限って使う',
              '  return <time dateTime={iso} suppressHydrationWarning>{text ?? "—"}</time>',
              '}',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'data',
    no: '07',
    title: 'データ取得とキャッシュ',
    subtitle: 'Data Fetching',
    summary: 'Next.js のキャッシュは層が多い。どの層で止まっているかを言えるようにしておく。',
    sections: [
      {
        id: 'data-fetch',
        title: 'Server Component で取得する',
        lead:
          'useEffect + fetch は使わない。await をそのまま書けば、ブラウザへ JS を送らずに済み、' +
          'ウォーターフォール（順番待ち）も減らせる。',
        blocks: [
          {
            kind: 'code',
            label: '並行に取る',
            code: [
              'export default async function Dashboard() {',
              '  // 逐次 await は待ち時間が足し算になる',
              '  // const user = await getUser()',
              '  // const posts = await getPosts()',
              '',
              '  // 依存がないなら並行に',
              '  const [user, posts] = await Promise.all([getUser(), getPosts()])',
              '',
              '  return <View user={user} posts={posts} />',
              '}',
            ],
          },
          {
            kind: 'code',
            label: '遅い部分だけ後から出す（ストリーミング）',
            code: [
              'import { Suspense } from "react"',
              '',
              'export default function Page() {',
              '  return (',
              '    <>',
              '      <Header />                       {/* すぐ出る */}',
              '      <Suspense fallback={<Skeleton />}>',
              '        <SlowReport />                 {/* 準備でき次第あとから届く */}',
              '      </Suspense>',
              '    </>',
              '  )',
              '}',
              '',
              'async function SlowReport() {',
              '  const data = await heavyQuery()   // ここで待っても Header は止まらない',
              '  return <Report data={data} />',
              '}',
            ],
          },
        ],
      },
      {
        id: 'data-cache',
        title: 'キャッシュの制御',
        lead:
          'Next.js 15 で既定が変わり、fetch は既定でキャッシュされなくなった（no-store 相当）。' +
          'バージョンごとに既定が違うので、意図があるなら明示的に書く。',
        blocks: [
          {
            kind: 'code',
            label: 'fetch 単位',
            code: [
              '// 毎回取り直す（既定）',
              'await fetch(url, { cache: "no-store" })',
              '',
              '// ビルド時の結果を使い回す',
              'await fetch(url, { cache: "force-cache" })',
              '',
              '// 60 秒ごとに裏で作り直す（ISR）',
              'await fetch(url, { next: { revalidate: 60 } })',
              '',
              '// タグを付けて、更新時に狙って捨てる',
              'await fetch(url, { next: { tags: ["posts"] } })',
            ],
          },
          {
            kind: 'code',
            label: 'ルート単位 / 更新時',
            code: [
              '// app/posts/page.tsx',
              'export const revalidate = 3600      // このルートを 1 時間で作り直す',
              'export const dynamic = "force-dynamic"  // 常に動的に（キャッシュしない）',
              '',
              '// 更新した側からキャッシュを捨てる',
              '"use server"',
              'import { revalidateTag, revalidatePath } from "next/cache"',
              '',
              'export async function createPost(input: PostInput) {',
              '  await db.post.create({ data: input })',
              '  revalidateTag("posts")        // tags: ["posts"] を付けた取得が対象',
              '  revalidatePath("/posts")      // そのパスの描画結果を捨てる',
              '}',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'cookies() / headers() を呼ぶとそのルートは動的になる',
            body:
              '静的化されていたページが、cookies() を 1 回呼んだだけでリクエストごとの描画に変わる。' +
              '「なぜか遅くなった」の典型的な原因。呼ぶ位置を、必要な小さいコンポーネントの中へ寄せること。' +
              'これらも Next.js 15 では await が必要（const store = await cookies()）。',
          },
        ],
      },
      {
        id: 'data-client',
        title: 'クライアント側で取得するとき',
        lead:
          '無限スクロール・ポーリング・楽観更新など、クライアントで持つ理由があるときだけ。' +
          '自前の useEffect + fetch ではなく、キャッシュを持つライブラリを使う。',
        blocks: [
          {
            kind: 'code',
            label: 'TanStack Query',
            code: [
              '"use client"',
              'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"',
              '',
              'export function useAppointments() {',
              '  return useQuery({',
              '    queryKey: ["appointments"],',
              '    queryFn: () => api.get("/appointments"),',
              '    staleTime: 30_000,          // 30 秒は取り直さない',
              '  })',
              '}',
              '',
              'export function useCancelAppointment() {',
              '  const qc = useQueryClient()',
              '  return useMutation({',
              '    mutationFn: (id: string) => api.delete(`/appointments/${id}`),',
              '    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),',
              '  })',
              '}',
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'サーバー状態とクライアント状態を混ぜない',
            body:
              'サーバーが持っているデータの写しは「キャッシュ」であって、アプリの状態ではない。' +
              'Zustand や Context に fetch した結果を溜め込むと、再取得・失効・競合の面倒を全部自分で書くことになる。' +
              'サーバー由来は TanStack Query、UI 都合（モーダルの開閉など）だけを自前の state に置く。',
          },
        ],
      },
    ],
  },
  {
    id: 'forms',
    no: '08',
    title: 'フォームと Server Actions',
    subtitle: 'Forms',
    summary: '検証はクライアントとサーバーの両方で行う。クライアント側は親切心、サーバー側が本番。',
    sections: [
      {
        id: 'forms-action',
        title: 'Server Actions',
        lead:
          '"use server" を付けた関数はサーバーで実行され、フォームの action に直接渡せる。' +
          'API ルートを 1 本書く手間が消えるが、公開エンドポイントであることは変わらない。',
        blocks: [
          {
            kind: 'code',
            label: 'app/appointments/actions.ts',
            code: [
              '"use server"',
              '',
              'import { z } from "zod"',
              'import { revalidatePath } from "next/cache"',
              '',
              'const schema = z.object({',
              '  name: z.string().min(1, "お名前を入力してください"),',
              '  email: z.string().email("メールアドレスの形式が正しくありません"),',
              '  desiredAt: z.coerce.date(),',
              '})',
              '',
              'export type ActionState = {',
              '  ok: boolean',
              '  message?: string',
              '  fieldErrors?: Record<string, string[]>',
              '}',
              '',
              'export async function createAppointment(',
              '  _prev: ActionState,',
              '  formData: FormData,',
              '): Promise<ActionState> {',
              '  // 1. 認可を必ずここで確認する（クライアントの判定は当てにしない）',
              '  const user = await getCurrentUser()',
              '  if (!user) return { ok: false, message: "ログインが必要です" }',
              '',
              '  // 2. 入力を検証する',
              '  const parsed = schema.safeParse(Object.fromEntries(formData))',
              '  if (!parsed.success) {',
              '    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }',
              '  }',
              '',
              '  // 3. 実行してキャッシュを捨てる',
              '  await db.appointment.create({ data: { ...parsed.data, userId: user.id } })',
              '  revalidatePath("/appointments")',
              '  return { ok: true, message: "予約を受け付けました" }',
              '}',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'Server Action は誰でも呼べる HTTP エンドポイント',
            body:
              '画面にボタンを出していないから安全、にはならない。認証・認可・入力検証を関数の先頭で必ず行う。' +
              'クライアント側でボタンを disabled にするのは表示上の親切であって、防御ではない。',
          },
        ],
      },
      {
        id: 'forms-state',
        title: 'useActionState と送信中の表示',
        lead: 'React 19 の組み合わせ。JS が無効でも動く形のまま、送信状態を扱える。',
        blocks: [
          {
            kind: 'code',
            label: 'app/appointments/AppointmentForm.tsx',
            code: [
              '"use client"',
              '',
              'import { useActionState } from "react"',
              'import { useFormStatus } from "react-dom"',
              'import { createAppointment, type ActionState } from "./actions"',
              '',
              'const initial: ActionState = { ok: false }',
              '',
              'export function AppointmentForm() {',
              '  const [state, formAction] = useActionState(createAppointment, initial)',
              '',
              '  return (',
              '    <form action={formAction}>',
              '      <input name="name" required />',
              '      {state.fieldErrors?.name && <p role="alert">{state.fieldErrors.name[0]}</p>}',
              '',
              '      <input name="email" type="email" required />',
              '      {state.fieldErrors?.email && <p role="alert">{state.fieldErrors.email[0]}</p>}',
              '',
              '      <SubmitButton />',
              '      {state.message && <p aria-live="polite">{state.message}</p>}',
              '    </form>',
              '  )',
              '}',
              '',
              '// useFormStatus は form の「中」でしか読めない。だから別部品に切る',
              'function SubmitButton() {',
              '  const { pending } = useFormStatus()',
              '  return <button disabled={pending}>{pending ? "送信中..." : "予約する"}</button>',
              '}',
            ],
          },
        ],
      },
      {
        id: 'forms-rhf',
        title: '入力が多いフォームは react-hook-form',
        lead:
          '項目が 10 を超える・入力中に細かく検証したい場合は react-hook-form + zod。' +
          'スキーマはサーバーと共有し、二重管理しない。',
        blocks: [
          {
            kind: 'code',
            label: 'クライアント側',
            code: [
              '"use client"',
              'import { useForm } from "react-hook-form"',
              'import { zodResolver } from "@hookform/resolvers/zod"',
              'import { appointmentSchema, type AppointmentInput } from "./schema"',
              '',
              'export function Form() {',
              '  const {',
              '    register,',
              '    handleSubmit,',
              '    formState: { errors, isSubmitting },',
              '  } = useForm<AppointmentInput>({',
              '    resolver: zodResolver(appointmentSchema),   // サーバーと同じスキーマ',
              '    defaultValues: { name: "", email: "" },',
              '  })',
              '',
              '  return (',
              '    <form onSubmit={handleSubmit(async (values) => { await submit(values) })}>',
              '      <input {...register("name")} aria-invalid={!!errors.name} />',
              '      {errors.name && <p role="alert">{errors.name.message}</p>}',
              '      <button disabled={isSubmitting}>送信</button>',
              '    </form>',
              '  )',
              '}',
            ],
          },
          {
            kind: 'list',
            title: 'アクセシビリティで最低限やること',
            items: [
              '<label htmlFor> と input の id を対応させる。placeholder はラベルの代わりにならない',
              'エラーは role="alert"、非同期の結果通知は aria-live="polite" で読み上げに乗せる',
              '入力エラーの要素に aria-invalid を付ける',
              '送信ボタンは disabled にするだけでなく、何が起きているかを文字でも出す',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'state',
    no: '09',
    title: '状態管理',
    subtitle: 'State',
    summary: '状態は「どこが持つか」より「そもそも持たなくて済むか」を先に考える。',
    sections: [
      {
        id: 'state-where',
        title: '置き場所を決める順番',
        lead: '上から順に検討し、必要になって初めて下へ降りる。最初から Context やストアへ行かない。',
        blocks: [
          {
            kind: 'table',
            head: ['順', '置き場所', '使うとき'],
            rows: [
              ['1', '算出する（state にしない）', '他の値から計算できる。合計・絞り込み結果・妥当性'],
              ['2', 'URL（searchParams）', 'タブ・ページ番号・検索条件。共有・戻るボタンが効く'],
              ['3', 'ローカル state', 'その部品の中で完結する。開閉・入力途中の値'],
              ['4', '親へ引き上げる', '兄弟で共有する。渡す階層が 2 つまでなら props で足りる'],
              ['5', 'TanStack Query', 'サーバー由来のデータ。取得・失効・再取得を任せる'],
              ['6', 'Context', 'テーマ・ロケール・認証ユーザーなど、変化が稀で全体が必要とするもの'],
              ['7', 'Zustand などのストア', '上のどれでも収まらない、広範囲で頻繁に変わる状態'],
            ],
          },
          {
            kind: 'code',
            label: 'URL に置くと状態管理が要らなくなる例',
            code: [
              '"use client"',
              'import { usePathname, useRouter, useSearchParams } from "next/navigation"',
              '',
              'export function TabBar() {',
              '  const router = useRouter()',
              '  const pathname = usePathname()',
              '  const params = useSearchParams()',
              '  const tab = params.get("tab") ?? "profile"',
              '',
              '  function select(next: string) {',
              '    const q = new URLSearchParams(params)',
              '    q.set("tab", next)',
              '    router.replace(`${pathname}?${q}`, { scroll: false })',
              '  }',
              '',
              '  // リロードしても共有しても同じ画面になる。state を持たずに済む',
              '  return <button onClick={() => select("history")} aria-current={tab === "history"}>履歴</button>',
              '}',
            ],
          },
        ],
      },
      {
        id: 'state-context',
        title: 'Context の落とし穴',
        lead:
          'Context は「配る仕組み」であって「状態管理」ではない。値が変わると、その Context を' +
          '読んでいる全コンポーネントが再描画される。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '避ける — 毎回新しいオブジェクトを渡す',
              code: [
                'export function AuthProvider({ children }) {',
                '  const [user, setUser] = useState<User | null>(null)',
                '',
                '  // 親が再描画されるたびに新しい参照になり、購読側が全部再描画される',
                '  return (',
                '    <AuthContext.Provider value={{ user, setUser }}>',
                '      {children}',
                '    </AuthContext.Provider>',
                '  )',
                '}',
              ],
            },
            good: {
              label: '推奨 — 参照を安定させる / 変化の頻度で分ける',
              code: [
                'export function AuthProvider({ children }: { children: React.ReactNode }) {',
                '  const [user, setUser] = useState<User | null>(null)',
                '  const value = useMemo(() => ({ user, setUser }), [user])',
                '',
                '  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>',
                '}',
                '',
                '// よく変わる値と滅多に変わらない値は Context を分ける',
                '// 例: 認証ユーザー（稀）と、通知の未読件数（頻繁）を同居させない',
              ],
            },
          },
          {
            kind: 'code',
            label: 'Provider の外で使われたら落とす',
            code: [
              'const AuthContext = createContext<AuthValue | null>(null)',
              '',
              'export function useAuth() {',
              '  const ctx = useContext(AuthContext)',
              '  if (!ctx) throw new Error("useAuth は AuthProvider の中でのみ使えます")',
              '  return ctx   // 呼び出し側は null を気にしなくてよくなる',
              '}',
            ],
          },
        ],
      },
      {
        id: 'state-reducer',
        title: '連動する状態は useReducer',
        lead:
          '複数の state が「同時に、決まった組で」変わるなら、更新の仕方を 1 箇所へ集める。' +
          '呼び出し側は「何が起きたか」だけを送る。',
        blocks: [
          {
            kind: 'code',
            label: 'reducer の形',
            code: [
              'type State =',
              '  | { status: "idle" }',
              '  | { status: "running"; startedAt: number }',
              '  | { status: "done"; result: string }',
              '',
              'type Action =',
              '  | { type: "start" }',
              '  | { type: "finish"; result: string }',
              '  | { type: "reset" }',
              '',
              'function reducer(state: State, action: Action): State {',
              '  switch (action.type) {',
              '    case "start":',
              '      if (state.status === "running") return state   // 二重起動を構造で防ぐ',
              '      return { status: "running", startedAt: Date.now() }',
              '    case "finish":',
              '      return { status: "done", result: action.result }',
              '    case "reset":',
              '      return { status: "idle" }',
              '  }',
              '}',
              '',
              'const [state, dispatch] = useReducer(reducer, { status: "idle" })',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'styling',
    no: '10',
    title: 'スタイリング',
    subtitle: 'Styling',
    summary: '見た目の決め方を 1 つに統一する。混在させると、どこを直せば効くのか分からなくなる。',
    sections: [
      {
        id: 'styling-choice',
        title: '手段の選び方',
        lead: 'App Router では、実行時にスタイルを組み立てる方式は相性が悪い。',
        blocks: [
          {
            kind: 'table',
            head: ['方式', '向き', '備考'],
            rows: [
              ['Tailwind CSS', '既定でこれ', 'クラス名を考えずに済む。App Router と相性がよい'],
              ['CSS Modules', '複雑な指定・アニメーション', 'Tailwind で書くと読めなくなる箇所だけ'],
              ['CSS-in-JS（実行時）', '推奨しない', 'Server Component で動かず、全体の Client 化を招く'],
              ['グローバル CSS', 'リセットと変数だけ', 'app/globals.css に限定する'],
            ],
          },
          {
            kind: 'code',
            label: '条件付きクラスは clsx + tailwind-merge',
            code: [
              'import { clsx, type ClassValue } from "clsx"',
              'import { twMerge } from "tailwind-merge"',
              '',
              '// src/lib/cn.ts',
              'export function cn(...inputs: ClassValue[]) {',
              '  return twMerge(clsx(inputs))',
              '}',
              '',
              '// 後勝ちが正しく効く。px-2 と px-4 が両方残る事故を防ぐ',
              '<button className={cn(',
              '  "rounded-xl px-4 py-2 font-bold",',
              '  variant === "primary" && "bg-blue-600 text-white",',
              '  disabled && "opacity-50 pointer-events-none",',
              '  className,                 // 呼び出し側の上書きを最後に',
              ')} />',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'クラス名を文字列連結で組み立てない',
            body:
              'Tailwind はソースを走査してクラスを抽出するため、`text-${color}-500` のように' +
              '組み立てた名前は CSS が生成されない。使い得る候補を丸ごと書くか、' +
              'Record<Variant, string> の対応表を用意する。',
          },
        ],
      },
      {
        id: 'styling-tokens',
        title: '色とサイズは対応表で持つ',
        lead: '値を直書きすると、変更時に全ファイルを検索することになる。',
        blocks: [
          {
            kind: 'code',
            label: 'variant を型と対応表で管理する',
            code: [
              'const BUTTON_VARIANTS = {',
              '  primary: "bg-blue-600 text-white hover:bg-blue-700",',
              '  secondary: "bg-white text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50",',
              '  danger: "bg-red-600 text-white hover:bg-red-700",',
              '} as const',
              '',
              'type Variant = keyof typeof BUTTON_VARIANTS   // "primary" | "secondary" | "danger"',
              '',
              '// variant を増やしたら型が追随する。書き漏れが型エラーになる',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'performance',
    no: '11',
    title: 'パフォーマンス',
    subtitle: 'Performance',
    summary: '測ってから直す。memo を先回りで撒くのは、読みにくさだけが確実に増える取引。',
    sections: [
      {
        id: 'perf-order',
        title: '効く順に手を付ける',
        lead:
          'React の再描画を削るより、そもそも送るものを減らすほうが効く。上から順に見る。',
        blocks: [
          {
            kind: 'list',
            items: [
              '1. 画像 — next/image を使い、サイズを指定する。ここが最も効く',
              '2. バンドル — Client Component を減らす。重いライブラリを dynamic import で切り離す',
              '3. データ — 逐次 await をやめて Promise.all に。遅い部分は Suspense で分ける',
              '4. フォント — next/font で自己ホストし、レイアウトのずれを止める',
              '5. 再描画 — ここまでやってなお遅いときに memo / useMemo を検討する',
            ],
          },
          {
            kind: 'code',
            label: '重い部品を切り離す',
            code: [
              'import dynamic from "next/dynamic"',
              '',
              '// グラフライブラリなど、初期表示に不要で重いもの',
              'const Chart = dynamic(() => import("./Chart"), {',
              '  loading: () => <Skeleton />,',
              '  ssr: false,          // ブラウザ API に依存する部品はこれで除外',
              '})',
            ],
          },
          {
            kind: 'code',
            label: 'next/image と next/font',
            code: [
              'import Image from "next/image"',
              'import { Noto_Sans_JP } from "next/font/google"',
              '',
              'const noto = Noto_Sans_JP({ subsets: ["latin"], display: "swap" })',
              '',
              '<Image',
              '  src="/hero.png"',
              '  alt="サービス概要"     // 装飾なら alt="" にする。省略はしない',
              '  width={1200}',
              '  height={630}          // width/height か fill が必須。ずれを防ぐため',
              '  priority              // 画面上部の 1 枚だけに付ける',
              '/>',
            ],
          },
        ],
      },
      {
        id: 'perf-memo',
        title: 'memo / useMemo / useCallback',
        lead:
          'これらは無料ではない。比較のコストとメモリを払っている。' +
          '「重い」と計測できた場所にだけ置く。',
        blocks: [
          {
            kind: 'list',
            title: '入れてよい条件',
            items: [
              'React DevTools Profiler で、その部品の描画が実際に長いと確認できた',
              '子を memo 化しており、その props に関数やオブジェクトを渡している',
              '依存配列に渡す値で、参照が変わると effect が無限に走ってしまう',
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'React Compiler が入ったら手動の memo 化は減らせる',
            body:
              'React Compiler は再描画の最適化を自動で行う。導入している（または導入予定の）プロジェクトでは、' +
              '手で撒いた useMemo / useCallback がかえって邪魔になる。' +
              '新規に足す前に、プロジェクトで有効かどうかを確認すること。',
          },
        ],
      },
    ],
  },
  {
    id: 'testing',
    no: '12',
    title: 'テスト',
    subtitle: 'Testing',
    summary: '実装の詳細ではなく、画面に見えるもの・利用者がする操作を対象にする。',
    sections: [
      {
        id: 'test-stack',
        title: '構成',
        lead: 'Vitest + Testing Library を単体・結合に、Playwright を通しの確認に。',
        blocks: [
          {
            kind: 'code',
            label: 'コンポーネントのテスト',
            code: [
              'import { render, screen } from "@testing-library/react"',
              'import userEvent from "@testing-library/user-event"',
              'import { expect, test, vi } from "vitest"',
              '',
              'test("必須項目が空なら送信できない", async () => {',
              '  const user = userEvent.setup()',
              '  const onSubmit = vi.fn()',
              '  render(<AppointmentForm onSubmit={onSubmit} />)',
              '',
              '  // 取得は「利用者の見え方」に近い順で: role → label → text',
              '  await user.click(screen.getByRole("button", { name: "予約する" }))',
              '',
              '  expect(await screen.findByRole("alert")).toHaveTextContent("お名前")',
              '  expect(onSubmit).not.toHaveBeenCalled()',
              '})',
            ],
          },
          {
            kind: 'table',
            head: ['取得方法', '使う場面', '優先度'],
            rows: [
              ['getByRole', 'ボタン・入力・見出し', '最優先。アクセシビリティも同時に検査される'],
              ['getByLabelText', 'フォーム項目', 'ラベルとの対応が取れているか確認できる'],
              ['getByText', '表示文言', '見出し以外の文章'],
              ['getByTestId', '他に手段がないとき', '最後の手段。使うほど壊れにくいが意味は薄い'],
              ['getBy… / findBy…', '同期 / 非同期', '非同期の出現を待つのは findBy 系'],
            ],
          },
        ],
      },
      {
        id: 'test-what',
        title: '何をテストするか',
        lead: 'カバレッジの数字ではなく、壊れたときに気づきたい箇所から書く。',
        blocks: [
          {
            kind: 'list',
            title: '書く価値が高い順',
            items: [
              '入力検証と、その結果としてのエラー表示（仕様がそのまま書ける）',
              '条件による表示の出し分け（権限・状態による分岐）',
              'zod スキーマそのもの（境界値・想定外の入力）',
              '通しの主要導線 1 本を Playwright で（登録 → 予約 → 確認）',
            ],
          },
          {
            kind: 'list',
            title: '書かなくてよいもの',
            items: [
              'useState が更新されること自体（React のテストになっている）',
              'クラス名が付いているかどうか（実装の詳細。リファクタで壊れるだけ）',
              'モックだらけで、結局モックの挙動を確認しているだけのテスト',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'quality',
    no: '13',
    title: '規約と静的解析',
    subtitle: 'Quality',
    summary: 'レビューで人が指摘することを減らす。機械で決まることは機械に任せる。',
    sections: [
      {
        id: 'quality-lint',
        title: 'ESLint / Prettier / CI',
        lead: '設定は最小限に。動かない設定を大量に持つより、効く数本を確実に回す。',
        blocks: [
          {
            kind: 'code',
            label: 'package.json の scripts',
            code: [
              '{',
              '  "scripts": {',
              '    "dev": "next dev",',
              '    "build": "next build",',
              '    "lint": "next lint",',
              '    "typecheck": "tsc --noEmit",',
              '    "test": "vitest run",',
              '    "format": "prettier --write ."',
              '  }',
              '}',
            ],
          },
          {
            kind: 'code',
            label: 'CI で回す最低限',
            code: [
              '# .github/workflows/ci.yml',
              '- run: npm ci',
              '- run: npm run typecheck   # 型',
              '- run: npm run lint        # 規約',
              '- run: npm run test        # テスト',
              '- run: npm run build       # 本番ビルドが通ること',
              '',
              '# 4 つを別ステップにする。まとめると、どれで落ちたか分からなくなる',
            ],
          },
          {
            kind: 'list',
            title: '特に効く lint ルール',
            items: [
              'react-hooks/exhaustive-deps — 依存配列の漏れ。警告ではなくエラーにする',
              'react-hooks/rules-of-hooks — 条件分岐の中でのフック呼び出し',
              '@typescript-eslint/no-floating-promises — await 忘れ。握り潰された非同期エラーを防ぐ',
              '@typescript-eslint/no-explicit-any — any を書くなら理由をコメントで残させる',
            ],
          },
        ],
      },
      {
        id: 'quality-naming',
        title: '命名と書き方',
        lead: '迷う時間をなくすために決めておく。中身より、揃っていることが重要。',
        blocks: [
          {
            kind: 'table',
            head: ['対象', '規則', '例'],
            rows: [
              ['コンポーネント', 'PascalCase。ファイル名も同じ', 'AppointmentForm.tsx'],
              ['フック', 'use で始める camelCase', 'useDebouncedValue.ts'],
              ['その他のモジュール', 'camelCase', 'formatDate.ts'],
              ['定数', 'SCREAMING_SNAKE_CASE', 'ROLE_LABELS'],
              ['真偽値', 'is / has / can で始める', 'isSubmitting, canEdit'],
              ['イベントハンドラ', 'handleXxx（定義側）/ onXxx（props 側）', 'handleSubmit / onSubmit'],
              ['型', 'PascalCase。接頭辞 I は付けない', 'User, AppointmentInput'],
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'コメントは「なぜ」を書く',
            body:
              '何をしているかはコードを読めば分かる。書くべきなのは、なぜその選択をしたか、' +
              '何を避けようとしているか、消すと何が壊れるか。' +
              'このリポジトリの既存ファイルもその方針で書かれているので、揃えること。',
          },
        ],
      },
    ],
  },
  {
    id: 'deploy',
    no: '14',
    title: 'ビルドとデプロイ',
    subtitle: 'Deployment',
    summary: 'ローカルで動くことと本番で動くことは別。ビルド時と実行時の違いが事故の元。',
    sections: [
      {
        id: 'deploy-env',
        title: '環境変数の扱い',
        lead:
          'NEXT_PUBLIC_ が付いた変数はビルド時にバンドルへ焼き込まれる。' +
          'つまり、実行時に環境変数を差し替えても値は変わらない。',
        blocks: [
          {
            kind: 'table',
            head: ['種類', '読める場所', '差し替え'],
            rows: [
              ['NEXT_PUBLIC_XXX', 'サーバー・ブラウザ両方', 'ビルドし直しが必要。秘密情報は不可'],
              ['XXX（接頭辞なし）', 'サーバーのみ', '実行時に反映。秘密情報はこちら'],
              ['.env.local', 'ローカル開発', 'git にコミットしない'],
              ['.env.production', '本番ビルド', '秘密情報は入れず、CI の secrets から渡す'],
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'Docker のマルチステージビルドで落ちやすい',
            body:
              'NEXT_PUBLIC_ な値はビルドステージで必要になる。実行ステージにだけ環境変数を渡すと、' +
              'undefined が焼き込まれた状態で本番が動く。ビルド引数として渡すこと。',
          },
        ],
      },
      {
        id: 'deploy-build',
        title: 'ビルドの確認',
        lead: '本番と同じ手順をローカルで一度通す。dev では出ないエラーが必ずある。',
        blocks: [
          {
            kind: 'code',
            label: '出す前に',
            code: [
              'npm run build && npm run start   # 本番モードで起動して確認',
              '',
              '# ビルド出力の見方',
              '# ○ (Static)   … ビルド時に生成。速い',
              '# ● (SSG)      … generateStaticParams で生成',
              '# ƒ (Dynamic)  … リクエストごとに実行',
              '#',
              '# Static のつもりが Dynamic になっていたら、cookies() / headers() /',
              '# searchParams / no-store の fetch がどこかで呼ばれている',
            ],
          },
          {
            kind: 'code',
            label: 'Docker で動かすとき',
            code: [
              '// next.config.ts',
              'export default {',
              '  output: "standalone",   // 依存を含めた最小構成を .next/standalone に出す',
              '}',
              '',
              '# Dockerfile（実行ステージ）',
              '# COPY --from=builder /app/.next/standalone ./',
              '# COPY --from=builder /app/.next/static ./.next/static',
              '# COPY --from=builder /app/public ./public',
              '# CMD ["node", "server.js"]',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pitfalls',
    no: '15',
    title: 'よくある落とし穴',
    subtitle: 'Pitfalls',
    summary: '症状から原因を引く。詰まったらまずここを見る。',
    sections: [
      {
        id: 'pitfalls-errors',
        title: 'エラーメッセージから引く',
        lead: '実際によく出るものだけを並べた。',
        blocks: [
          {
            kind: 'table',
            head: ['症状', '原因', '対処'],
            rows: [
              [
                'You\'re importing a component that needs useState',
                'Server Component でフックを使っている',
                'そのファイルの 1 行目に "use client" を置く。または対話部分だけ切り出す',
              ],
              [
                'Functions cannot be passed directly to Client Components',
                'Server から Client へ関数を props で渡した',
                'Server Action にする（"use server"）か、Client 側で定義する',
              ],
              [
                'Hydration failed / did not match',
                '初回描画がサーバーとブラウザで食い違った',
                'Date・random・localStorage を描画中に使わない。useEffect へ移す',
              ],
              [
                'params should be awaited',
                'Next.js 15 で params / searchParams が Promise になった',
                'await params してから分解する',
              ],
              [
                'useSearchParams should be wrapped in a suspense boundary',
                '静的化されるページで使っている',
                '小さな Client Component に切り出して <Suspense> で囲む',
              ],
              [
                'Maximum update depth exceeded',
                'effect の中で state を更新し、その state が依存配列にある',
                '依存を見直す。多くはその effect 自体が不要',
              ],
              [
                'Text content does not match server-rendered HTML',
                '上と同じ hydration 不一致',
                '時刻・乱数・環境依存の値をマウント後に描画する',
              ],
              [
                'Module not found: Can\'t resolve \'fs\'',
                'サーバー専用モジュールが Client 側へ引き込まれた',
                'import "server-only" を付けて境界を明示し、import 元をたどる',
              ],
            ],
          },
        ],
      },
      {
        id: 'pitfalls-review',
        title: 'レビュー前の自己点検',
        lead: 'PR を出す前にこれだけは見る。指摘の大半がここに集まる。',
        blocks: [
          {
            kind: 'list',
            items: [
              '"use client" が必要最小限の葉に付いているか。ページ全体に付けていないか',
              '秘密情報が NEXT_PUBLIC_ や Client Component へ漏れていないか',
              'Server Action の先頭で、認証・認可・入力検証を行っているか',
              'useEffect を足したなら、それが本当に「外部との同期」か',
              '依存配列を lint の警告を消すために削っていないか',
              'key に index を使っていないか',
              '型の定義元が 1 箇所か。as で型を偽っていないか',
              'エラー時と読み込み中の表示を用意したか',
              'npm run typecheck / lint / test / build が全部通るか',
            ],
          },
        ],
      },
      {
        id: 'pitfalls-commands',
        title: 'コマンド早見表',
        lead: '手が止まったときのために。',
        blocks: [
          {
            kind: 'code',
            label: 'よく使うもの',
            code: [
              'npm run dev                     # 開発サーバー',
              'npm run build                   # 本番ビルド（型エラーもここで出る）',
              'npx tsc --noEmit                # 型だけ確認',
              'npx next lint --fix             # 自動修正できる指摘を直す',
              'npx vitest --ui                 # テストを画面で確認',
              'npx playwright test --headed    # 通しテストをブラウザ表示で',
              'rm -rf .next && npm run dev     # キャッシュ由来の不可解な挙動をリセット',
              'npx @next/codemod@latest upgrade latest   # バージョン移行の自動書き換え',
            ],
          },
        ],
      },
    ],
  },
]
