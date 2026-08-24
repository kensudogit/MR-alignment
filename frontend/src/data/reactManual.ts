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
  {
    id: 'python',
    no: '16',
    title: 'Python 講習',
    subtitle: 'Python / AWS Lambda',
    summary:
      'フロントの隣にいるバックエンドを読めるようにするための章。教材は公開している AWS Lambda 関数 1 本で、' +
      '型ヒント・データクラス・デコレータ・async をすべて実際に動いているコードから拾う。',
    sections: [
      {
        id: 'py-material',
        title: '教材と読む順番',
        lead:
          '教材は kensudogit/lambda の lambda_function.py（約 2,600 行）。API Gateway + Lambda + DynamoDB の' +
          '検索 API に、クローラーと Google Sheets 連携が乗っている。上から通読すると必ず途中で止まるので、' +
          '下の対応表で必要な節に飛ぶこと。',
        blocks: [
          {
            kind: 'text',
            body:
              '教材コードは https://github.com/kensudogit/lambda/blob/main/lambda_function.py にある。' +
              'ファイル自身が「セクション1〜11」に区切られ、各セクションの冒頭に学習ポイントが書いてある。' +
              'この章はその区切りに沿って、実務で判断が要る箇所だけを抜き出したもの。',
          },
          {
            kind: 'code',
            label: 'ターミナル — 手元に落として読む',
            code: [
              'git clone https://github.com/kensudogit/lambda.git',
              'cd lambda',
              '',
              'python -m venv .venv',
              'source .venv/bin/activate        # Windows は .venv\\Scripts\\activate',
              '',
              'python -m pip install -U pip',
              'pip install boto3 aws-lambda-powertools aiohttp beautifulsoup4 cachetools backoff',
              '',
              'python -m py_compile lambda_function.py   # 構文だけ確認する',
              '# import まで通すには AWS の資格情報が要る。読むだけなら通らなくてよい',
            ],
          },
          {
            kind: 'table',
            head: ['教材のセクション', '扱う題材', 'この章の節'],
            rows: [
              ['1〜2', 'import の並べ方、環境変数と定数', '#py-env'],
              ['6, 8', '型ヒント、safe_cast による安全な変換', '#py-typing'],
              ['7', '@dataclass とファクトリメソッド', '#py-dataclass'],
              ['6', 'RateLimiter クラスと状態の持ち方', '#py-class'],
              ['9', 'デコレータ、@wraps、共通処理の外出し', '#py-decorator'],
              ['—', '例外クラスの階層とエラーレスポンス', '#py-error'],
              ['10, 11', 'async / await、gather、Semaphore', '#py-async'],
              ['3〜5', 'Lambda ハンドラ、CORS、コールドスタート', '#py-lambda'],
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: '動かすことは目的ではない',
            body:
              'この教材は boto3 と aws_lambda_powertools が前提で、実行には AWS の資格情報と DynamoDB のテーブルが要る。' +
              '講習の目的は読解と写経なので、動かせなくても構わない。手を動かすのは #py-exercise の課題の側でやる。',
          },
        ],
      },
      {
        id: 'py-env',
        title: '環境と道具立て',
        lead:
          'Python はインタプリタが緩いぶん、道具で締める。仮想環境・フォーマッタ・型チェック・テストの 4 点を' +
          '最初に置く。TypeScript でいえば tsconfig を決める作業に当たる。',
        blocks: [
          {
            kind: 'code',
            label: 'pyproject.toml — 最小構成',
            code: [
              '[project]',
              'name = "lambda-training"',
              'requires-python = ">=3.12"',
              '',
              '[tool.ruff]',
              'line-length = 120',
              'target-version = "py312"',
              '',
              '[tool.ruff.lint]',
              '# E,F=基本の指摘 I=import順 UP=新しい書き方へ B=バグになりやすい書き方',
              'select = ["E", "F", "I", "UP", "B"]',
              '',
              '[tool.mypy]',
              'python_version = "3.12"',
              'strict = true                   # TypeScript の strict に相当。新規コードは必ず有効に',
              'ignore_missing_imports = true   # 型定義の無い外部ライブラリを許す',
            ],
          },
          {
            kind: 'code',
            label: 'ターミナル — 常用する 4 つ',
            code: [
              'ruff format .          # 整形。black 相当',
              'ruff check . --fix     # 静的解析。import 順や未使用変数もここで直る',
              'mypy lambda_function.py',
              'pytest -q',
            ],
          },
          {
            kind: 'list',
            title: 'import の並べ方（教材のセクション1がそのまま手本）',
            items: [
              '標準ライブラリ → サードパーティ → 自作モジュール の順に、空行で 3 ブロックに分ける',
              'import X と from X import Y はブロック内で混ぜてよい。ruff の I ルールが自動で並べ替える',
              '任意依存は try / except ImportError で包み、GOOGLE_SHEETS_AVAILABLE のようなフラグに落とす。教材の gspread がこの形',
              'ワイルドカード import（from x import *）は使わない。どこから来た名前か追えなくなる',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: '環境変数をコードから書き換えない',
            body:
              '教材の冒頭には os.environ["POSTS_TABLE_NAME"] = "wp_posts" という行がある。学習用に既定値を埋めるための書き方で、' +
              '実務では逆になる。Lambda の設定やコンテナの環境変数を正とし、コード側は os.getenv("POSTS_TABLE_NAME") で' +
              '読むだけにすること。コードが上書きすると、環境ごとの切り替えが効かなくなる。',
          },
        ],
      },
      {
        id: 'py-typing',
        title: '型ヒントと安全な変換',
        lead:
          'Python の型ヒントは実行時に何も検査しない。書いた型を守らせるのは mypy とテストであって、処理系ではない。' +
          'だから外から来た値は、型ヒントとは別に必ず変換の関門を通す。',
        blocks: [
          {
            kind: 'table',
            head: ['書き方', '意味', '備考'],
            rows: [
              ['str | None', '値が無い場合がある', '3.10 以降。教材の Optional[str] と同じ意味'],
              ['list[str]', '文字列のリスト', '3.9 以降は typing.List でなく組み込みの list を使う'],
              ['dict[str, Any]', 'JSON 由来の辞書', 'Any は「まだ決めていない」印。境界の内側では剥がす'],
              ['tuple[bool, dict]', '2 つの値を返す', '教材の check_rate_limit がこの形'],
              ['-> None', '返り値なし', '書き忘れると mypy が関数全体の検査を諦める'],
            ],
          },
          {
            kind: 'compare',
            bad: {
              label: '危ない — 外から来た値を直接変換する',
              code: [
                '# DynamoDB から取った item をそのまま int にする',
                'post_id = int(item.get("ID"))',
                'count = int(item.get("comment_count"))',
                '',
                '# 項目が無ければ int(None) で TypeError',
                '# "12,3" のような値が混ざれば ValueError',
                '# どちらも API 全体が 500 になる',
              ],
            },
            good: {
              label: '安全 — 変換の関門を 1 つ作る（教材 safe_cast）',
              code: [
                'def safe_cast(value: Any, to_type: type, default: Any = None) -> Any:',
                '    """変換できなければ default を返す"""',
                '    try:',
                '        return to_type(value)',
                '    except (ValueError, TypeError):',
                '        return default',
                '',
                'post_id = safe_cast(item.get("ID"), int, 0)',
                'count = safe_cast(item.get("comment_count"), int, 0)',
              ],
            },
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'except は捕まえる例外を書く',
            body:
              'safe_cast が except (ValueError, TypeError) と限定しているのが要点。裸の except: と書くと ' +
              'KeyboardInterrupt や SystemExit まで飲み込み、止めたいときに止まらないプロセスができる。' +
              '広く捕まえたい場合でも except Exception までにとどめること。',
          },
          {
            kind: 'text',
            body:
              'TypeScript でいえば safe_cast は zod の safeParse に当たる。「境界で 1 度だけ検証し、内側では信じる」' +
              'という考え方は #ts-boundary と同じで、言語が変わっても変わらない。',
          },
        ],
      },
      {
        id: 'py-dataclass',
        title: 'データクラスでデータの形を決める',
        lead:
          '辞書を持ち回すと、キーの綴り間違いが実行するまで分からない。@dataclass で形を決めて、' +
          '外部データからの変換はクラスメソッドに 1 か所へ集める。',
        blocks: [
          {
            kind: 'code',
            label: '教材 WpPost — 抜粋',
            code: [
              'from dataclasses import dataclass',
              '',
              '@dataclass',
              'class WpPost:',
              '    """WordPress 投稿のデータモデル"""',
              '    site_code: str',
              '    ID: int',
              '    post_title: str',
              '    post_content: str',
              '    post_status: str',
              '    comment_count: int',
              '',
              '    @classmethod',
              '    def from_dynamodb_item(cls, item: dict) -> "WpPost":',
              '        """DynamoDB のアイテムから作るファクトリメソッド"""',
              '        return cls(',
              '            site_code=item.get("site_code", ""),',
              '            ID=safe_cast(item.get("ID"), int, 0),',
              '            post_title=item.get("post_title", ""),',
              '            post_content=item.get("post_content", ""),',
              '            post_status=item.get("post_status", ""),',
              '            comment_count=safe_cast(item.get("comment_count"), int, 0),',
              '        )',
            ],
          },
          {
            kind: 'list',
            title: 'この 20 行で効いていること',
            items: [
              '@dataclass が __init__ / __repr__ / __eq__ を自動で作る。手書きの定型コードが消える',
              'item.get("post_title", "") と既定値を書いているので、項目が欠けても落ちない',
              'from_dynamodb_item が DynamoDB を知る唯一の場所。テーブルの項目が変わってもここだけ直せばよい',
              '返り値の型を "WpPost" と文字列で書いているのは、クラス定義の途中で自分自身を参照するため',
            ],
          },
          {
            kind: 'compare',
            bad: {
              label: '起動時に落ちる — 可変オブジェクトを既定値にする',
              code: [
                '@dataclass',
                'class ScrapedContent:',
                '    url: str',
                '    links: list[str] = []',
                '',
                '# ValueError: mutable default <class list> for field links',
                '# 仮に通っても全インスタンスが同じリストを共有してしまう',
              ],
            },
            good: {
              label: 'field(default_factory=...) を使う',
              code: [
                'from dataclasses import dataclass, field',
                '',
                '@dataclass',
                'class ScrapedContent:',
                '    url: str',
                '    title: str',
                '    depth: int',
                '    links: list[str] = field(default_factory=list)',
                '    metadata: dict[str, Any] = field(default_factory=dict)',
              ],
            },
          },
          {
            kind: 'note',
            tone: 'tip',
            title: '書き換えないなら frozen=True',
            body:
              '@dataclass(frozen=True) にすると代入が禁止され、ハッシュ可能になって set や dict のキーに使える。' +
              '入力データを表すクラスは基本これでよい。教材の ScrapedContent のように、作ったあと触らないものが該当する。',
          },
        ],
      },
      {
        id: 'py-class',
        title: 'クラスに状態を持たせる',
        lead:
          '教材の RateLimiter は「状態をインスタンスに閉じ込める」見本。どこからでも触れるグローバル変数ではなく、' +
          'クラスの中に置き、外へは判定結果だけを返す。',
        blocks: [
          {
            kind: 'code',
            label: '教材 RateLimiter — 抜粋',
            code: [
              'from cachetools import TTLCache',
              '',
              'class RateLimiter:',
              '    """リクエストのレート制限を管理するクラス"""',
              '',
              '    def __init__(self, max_requests: int = 100, time_window: int = 3600):',
              '        self.max_requests = max_requests',
              '        self.time_window = time_window',
              '        # TTL 付きキャッシュ。time_window を過ぎた記録は自動で消える',
              '        self.cache = TTLCache(maxsize=1000, ttl=time_window)',
              '',
              '    def check_rate_limit(self, client_ip: str) -> tuple[bool, dict[str, Any]]:',
              '        current_time = int(time.time())',
              '',
              '        if client_ip not in self.cache:',
              '            self.cache[client_ip] = {"count": 0, "first_request": current_time}',
              '',
              '        client_data = self.cache[client_ip]',
              '        client_data["count"] += 1',
              '',
              '        rate_limit_info = {',
              '            "limit": self.max_requests,',
              '            "remaining": max(0, self.max_requests - client_data["count"]),',
              '            "reset": client_data["first_request"] + self.time_window,',
              '        }',
              '        return client_data["count"] <= self.max_requests, rate_limit_info',
            ],
          },
          {
            kind: 'list',
            title: '読みどころ',
            items: [
              'self は「そのインスタンス自身」。メソッドの第 1 引数に必ず書く。TypeScript の this と違い、明示するのが Python の流儀',
              '__init__ に既定値（max_requests=100）を置くと、呼び出し側は RateLimiter() だけで済む。変えたいときだけ渡す',
              '返り値が tuple[bool, dict] なので、呼び出し側は allowed, info = limiter.check_rate_limit(ip) と一度に受け取れる',
              '期限切れの掃除を自分で書かず TTLCache に任せている。時間で消える状態は、消し忘れが必ずバグになるので道具に任せる',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'モジュール直下で作ったインスタンスは呼び出しをまたいで生き残る',
            body:
              '教材は rate_limiter = RateLimiter() をモジュール直下に置いている。Lambda は一度起動したコンテナを使い回すため、' +
              'この状態は次の呼び出しにも残る。接続やキャッシュを持たせるにはこれが正解だが、' +
              '「1 リクエストごとに初期化されるはず」と思って書くと事故になる。コンテナが増えれば各コンテナが別々に数える点にも注意。',
          },
        ],
      },
      {
        id: 'py-decorator',
        title: 'デコレータで共通処理を外に出す',
        lead:
          'デコレータは「関数を受け取って関数を返す関数」でしかない。教材の error_handler を読めば、' +
          'ログと例外処理を全ハンドラから消せる理由が分かる。',
        blocks: [
          {
            kind: 'code',
            label: '教材 error_handler — 骨格',
            code: [
              'from functools import wraps',
              '',
              'def error_handler(func):',
              '    """例外を捕まえて 500 レスポンスに変換するデコレータ"""',
              '',
              '    @wraps(func)                      # 元の関数の名前と docstring を引き継ぐ',
              '    def wrapper(*args, **kwargs):',
              '        try:',
              '            logger.debug(f"=== Starting {func.__name__} ===")',
              '            return func(*args, **kwargs)',
              '        except Exception as e:',
              '            logger.error(f"Error Type: {type(e).__name__}")',
              '            logger.error(traceback.format_exc())',
              '            return {',
              '                "statusCode": 500,',
              '                "headers": {"Content-Type": APPLICATION_JSON},',
              '                "body": json.dumps({"error": INTERNAL_SERVER_ERROR_MESSAGE}),',
              '            }',
              '',
              '    return wrapper',
              '',
              '',
              '@app.post("/search")',
              '@error_handler',
              '@tracer.capture_method',
              'def search_handler():',
              '    ...',
            ],
          },
          {
            kind: 'list',
            title: '順序と引数の規則',
            items: [
              'デコレータは下から順に適用される。上の例では tracer が最も内側、error_handler がその外、ルート登録が最後',
              'だから @app.post は必ず一番上に置く。登録されるのは「全部の加工が済んだ関数」でなければならない',
              '*args, **kwargs で受けているのは、どんな引数の関数にも付けられるようにするため',
              '@wraps を忘れると func.__name__ がすべて wrapper になり、ログもトレースも判別できなくなる',
            ],
          },
          {
            kind: 'compare',
            bad: {
              label: '同期のまま async 関数に付ける',
              code: [
                'def record_metrics(func):',
                '    @wraps(func)',
                '    def wrapper(*args, **kwargs):',
                '        return func(*args, **kwargs)   # コルーチンをそのまま返す',
                '    return wrapper',
                '',
                '# 中身は走らないまま返る。計測もできず、警告だけが出る',
              ],
            },
            good: {
              label: '教材 record_metrics — async には async のラッパを書く',
              code: [
                'def record_metrics(func):',
                '    @wraps(func)',
                '    async def wrapper(*args, **kwargs):',
                '        start_time = time.time()',
                '        try:',
                '            result = await func(*args, **kwargs)',
                '            logger.info({',
                '                "metric_name": func.__name__,',
                '                "duration": time.time() - start_time,',
                '                "status": "success",',
                '            })',
                '            return result',
                '        except Exception as e:',
                '            logger.error({"metric_name": func.__name__, "error": str(e), "status": "error"})',
                '            raise',
                '    return wrapper',
              ],
            },
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'ログは辞書で渡す',
            body:
              'record_metrics は logger.info に辞書を渡している。Powertools の Logger はこれを構造化 JSON として出すので、' +
              'CloudWatch Logs Insights で duration の平均やエラー率をそのまま集計できる。' +
              'f-string で 1 行の文にしてしまうと、あとから正規表現で切り出す羽目になる。',
          },
        ],
      },
      {
        id: 'py-error',
        title: '例外を設計する',
        lead:
          '例外は「異常」ではなく「呼び出し側に伝える型」。ステータスコードを持たせた階層を作ると、' +
          'ハンドラ側の分岐が 1 か所で済む。',
        blocks: [
          {
            kind: 'code',
            label: '教材の例外階層',
            code: [
              'class CustomError(Exception):',
              '    """カスタムエラーの基底クラス"""',
              '    def __init__(self, message: str, status_code: int = 500, details: dict | None = None):',
              '        super().__init__(message)',
              '        self.status_code = status_code',
              '        self.message = message',
              '        self.details = details or {}',
              '',
              '',
              'class ServiceError(CustomError):        # 500 系',
              '    def __init__(self, message: str, details: dict | None = None):',
              '        super().__init__(message, status_code=500, details=details)',
              '',
              '',
              'class InitializationError(ServiceError):',
              '    pass',
              '',
              '',
              'class ValidationError(CustomError):     # 400',
              '    def __init__(self, message: str):',
              '        super().__init__(message, 400)',
              '',
              '',
              'class RateLimitError(CustomError):      # 429',
              '    def __init__(self, message: str, rate_limit_info: dict):',
              '        super().__init__(message, 429)',
              '        self.rate_limit_info = rate_limit_info',
            ],
          },
          {
            kind: 'table',
            head: ['例外', 'ステータス', '出す場面'],
            rows: [
              ['ValidationError', '400', 'キーワードが空、page が数値でないなど入力の不備'],
              ['RateLimitError', '429', '同一 IP からの呼び出しが上限を超えた'],
              ['InitializationError', '500', 'テーブルの取得に失敗したなど起動時の失敗'],
              ['ServiceError', '500', '外部サービス呼び出しの失敗全般'],
            ],
          },
          {
            kind: 'compare',
            bad: {
              label: '握りつぶす',
              code: [
                'try:',
                '    result = table.query(KeyConditionExpression=Key("ID").eq(post_id))',
                'except Exception:',
                '    return []          # 空を返す',
                '',
                '# 検索結果 0 件と、DB に繋がらない障害が区別できない',
                '# 監視にも何も出ないので、誰も気づかないまま壊れ続ける',
              ],
            },
            good: {
              label: '型を付けて上へ投げる',
              code: [
                'try:',
                '    result = table.query(KeyConditionExpression=Key("ID").eq(post_id))',
                'except botocore.exceptions.ClientError as e:',
                '    logger.error({"op": "query", "post_id": post_id, "error": str(e)})',
                '    raise ServiceError("投稿の取得に失敗しました", details={"post_id": post_id}) from e',
                '',
                '# from e を付けると元の例外が __cause__ に残り、traceback に両方出る',
              ],
            },
          },
          {
            kind: 'note',
            tone: 'warn',
            title: '例外の中身をそのままクライアントへ返さない',
            body:
              '教材は details を os.getenv("DEBUG") == "true" のときだけ載せている。' +
              '例外メッセージにはテーブル名・キー・内部パスが混じるので、既定では出さないこと。' +
              '調査に必要な情報はログ側へ、クライアントへは決まった文言とリクエスト ID だけを返す。',
          },
        ],
      },
      {
        id: 'py-async',
        title: 'async / await',
        lead:
          'async は待ち時間を重ねるための仕組みで、計算を速くするものではない。' +
          '効くのは HTTP や DB の応答待ちが並ぶところだけ。教材のクローラーがちょうどその形をしている。',
        blocks: [
          {
            kind: 'compare',
            bad: {
              label: '逐次 — 100 URL で 100 回分待つ',
              code: [
                'results = []',
                'async with aiohttp.ClientSession() as session:',
                '    for url in urls:',
                '        results.append(await fetch_url(session, url))',
                '',
                '# await をループで回すと、結局 1 件ずつ待っている',
              ],
            },
            good: {
              label: '教材 fetch_multiple_urls — まとめて待つ',
              code: [
                'async def fetch_url(session: aiohttp.ClientSession, url: str) -> dict:',
                '    try:',
                '        async with session.get(url) as response:',
                '            return {"url": url, "status": response.status, "content": await response.text()}',
                '    except Exception as e:',
                '        return {"url": url, "error": str(e)}',
                '',
                '',
                'async def fetch_multiple_urls(urls: list[str]) -> list[dict]:',
                '    async with aiohttp.ClientSession() as session:',
                '        tasks = [fetch_url(session, url) for url in urls]',
                '        return await asyncio.gather(*tasks)',
              ],
            },
          },
          {
            kind: 'text',
            body:
              'ただし gather はタスクを全部同時に走らせる。相手のサーバに 100 本同時に投げるのは迷惑であり、' +
              '自分側も接続が枯れる。教材のクローラーは Semaphore で同時実行数に蓋をしている。',
          },
          {
            kind: 'code',
            label: '教材 WebCrawlerScraper — 同時実行数を絞る',
            code: [
              'connector = aiohttp.TCPConnector(limit=self.max_concurrent)',
              'timeout = aiohttp.ClientTimeout(total=30)',
              '',
              'async with aiohttp.ClientSession(connector=connector, timeout=timeout,',
              '                                 headers={"User-Agent": USER_AGENT}) as session:',
              '',
              '    semaphore = asyncio.Semaphore(self.max_concurrent)',
              '',
              '    async def process_url(url: str, depth: int):',
              '        async with semaphore:            # 同時に入れるのは max_concurrent 本まで',
              '            if not self._should_crawl_url(url, domain, depth):',
              '                return',
              '            await asyncio.sleep(self.crawl_delay)   # 相手側への間隔を空ける',
              '            result = await self._scrape_url(session, url, depth)',
              '            ...',
            ],
          },
          {
            kind: 'list',
            title: '間違えやすいところ',
            items: [
              'time.sleep はイベントループごと止める。async の中では必ず await asyncio.sleep を使う',
              'boto3 は同期ライブラリ。async 関数から呼ぶなら await asyncio.to_thread(table.scan, Limit=1) のように別スレッドへ逃がす',
              'gather に return_exceptions=True を渡すと、1 本の失敗で全体が落ちなくなる。教材の fetch_url のように各タスク側で捕まえてもよい',
              'ClientSession は毎回作らず、1 つ作って使い回す。作り捨てると接続を張り直し続けることになる',
              'Lambda のハンドラは同期関数。教材は asyncio.new_event_loop() と run_until_complete で async の初期化処理を呼び出している',
            ],
          },
          {
            kind: 'code',
            label: '教材 synchronous_init — 同期の世界から async を呼ぶ',
            code: [
              '@backoff.on_exception(backoff.expo, Exception, max_tries=3)',
              'async def init() -> bool:',
              '    """指数バックオフ付きで初期化する。失敗しても 3 回まで試す"""',
              '    ...',
              '',
              '',
              'def synchronous_init() -> bool:',
              '    loop = asyncio.new_event_loop()',
              '    asyncio.set_event_loop(loop)',
              '    return loop.run_until_complete(init())',
              '',
              '',
              '# モジュール読み込み時に 1 度だけ走る = コールドスタート時のみ',
              'synchronous_init()',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'クローラーには守るべき決まりがある',
            body:
              '教材の RobotsChecker は robots.txt を読んで許可を確認し、CRAWL_DELAY_SECONDS で間隔を空け、' +
              'ドメインごとの取得数にも上限を置いている。技術的に取得できることと、取得してよいことは別。' +
              '対象サイトの利用規約と robots.txt を必ず確認し、既定値を緩める前に相手側の負荷を考えること。',
          },
        ],
      },
      {
        id: 'py-lambda',
        title: 'Lambda ハンドラの組み立て',
        lead:
          'Lambda は「関数を 1 つ公開する」だけの仕組みだが、コールドスタートとレスポンス形式の 2 点で' +
          '通常の Web アプリと勝手が違う。',
        blocks: [
          {
            kind: 'code',
            label: '教材 — 入口の 3 層',
            code: [
              '# 1. モジュール直下：コンテナが起きたときに 1 度だけ走る',
              'logger = Logger(service="content_query_service", level="DEBUG")',
              'tracer = Tracer(service="content_query_service")',
              'app = APIGatewayRestResolver(cors=CORSConfig(allow_origin="*", max_age=300))',
              'dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")',
              '',
              '# 2. ルーティング：Powertools が httpMethod と path を見て振り分ける',
              '@app.post("/search")',
              '@error_handler',
              'def search_handler():',
              '    body = app.current_event.json_body',
              '    ...',
              '',
              '# 3. ハンドラ：Lambda から最初に呼ばれる関数',
              'def lambda_handler(event: dict, context: LambdaContext) -> dict:',
              '    if not is_initialized and not synchronous_init():',
              '        return create_response(500, {"error": "Service initialization failed",',
              '                                     "request_id": context.aws_request_id})',
              '    if "httpMethod" in event:',
              '        return app.resolve(event, context)',
              '    return create_response(400, {"error": "Invalid action"})',
            ],
          },
          {
            kind: 'list',
            title: '3 層に分ける効き目',
            items: [
              '接続やクライアントをモジュール直下に置くと、温まったコンテナでは初期化を飛ばせる。1 リクエストあたり数百 ms 変わる',
              'ハンドラ本体は「初期化の確認」と「振り分け」だけにする。業務ロジックを書かないので、入口の異常だけをここで見られる',
              'API Gateway 経由と直接呼び出しの両方が来るので、httpMethod の有無で分けている。ヘルスチェックが後者',
              'context.aws_request_id をレスポンスに載せておくと、問い合わせを受けたときログを一発で引ける',
            ],
          },
          {
            kind: 'code',
            label: '教材 create_response — 返し方を 1 か所に固定する',
            code: [
              'def create_response(status_code: int, body: dict) -> dict:',
              '    return {',
              '        "statusCode": status_code,',
              '        "headers": {',
              '            "Content-Type": APPLICATION_JSON,',
              '            "Access-Control-Allow-Origin": "*",',
              '            "Access-Control-Allow-Methods": ALLOWED_METHODS,',
              '            "Access-Control-Allow-Headers": ALLOWED_HEADERS,',
              '        },',
              '        "body": body,',
              '    }',
            ],
          },
          {
            kind: 'note',
            tone: 'warn',
            title: 'allow_origin="*" のまま本番へ出さない',
            body:
              '教材の CORS 設定は allow_origin="*" で、コメントにも「本番環境では具体的なドメインを指定」とある。' +
              'Cookie や Authorization ヘッダを伴う呼び出しでは * は使えず、ブラウザ側で弾かれる。' +
              'フロントの配信ドメインを環境変数で渡し、環境ごとに切り替えること。',
          },
          {
            kind: 'code',
            label: 'DynamoDB の数値は Decimal で返る',
            code: [
              'from decimal import Decimal',
              '',
              'class DecimalEncoder(json.JSONEncoder):',
              '    """Decimal を JSON にできるようにするエンコーダ"""',
              '    def default(self, obj):',
              '        if isinstance(obj, Decimal):',
              '            return float(obj)',
              '        return super().default(obj)',
              '',
              '',
              '# これを付けないと TypeError: Object of type Decimal is not JSON serializable',
              'json.dumps(items, cls=DecimalEncoder, ensure_ascii=False)',
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: 'フロント側とつなぐとき',
            body:
              'この API を React から叩く場合、レスポンスの型は #ts-boundary の要領で境界に 1 度だけ書く。' +
              'Python 側の dataclass と TypeScript 側の型は自動では同期しないので、' +
              '項目を増やしたときは両方直したか必ず確認すること。',
          },
        ],
      },
      {
        id: 'py-exercise',
        title: '演習と確認',
        lead:
          '読むだけでは身につかないので、教材のコードを部分的に書き直す形で手を動かす。' +
          '5 問すべて lambda_function.py の中に手本がある。',
        blocks: [
          {
            kind: 'list',
            title: '課題',
            items: [
              '1. safe_cast を型変数で書き直す。TypeVar を使い、safe_cast("12", int, 0) の結果が int と推論されるようにして mypy を通す（#py-typing）',
              '2. WpPostMeta に from_dynamodb_item を書く。WpPost を手本に、項目が欠けても落ちないようにする（#py-dataclass）',
              '3. RateLimiter に reset(client_ip) を足し、上限に達したクライアントの記録だけを消せるようにする。テストも書く（#py-class）',
              '4. error_handler の async 版 async_error_handler を書き、await が要る関数にも同じ例外処理を掛けられるようにする（#py-decorator）',
              '5. fetch_multiple_urls を Semaphore 付きに直し、同時実行数を引数で受け取れるようにする（#py-async）',
            ],
          },
          {
            kind: 'code',
            label: 'pytest — 3 の答え合わせに使うテスト',
            code: [
              'import pytest',
              '',
              'from lambda_function import RateLimiter',
              '',
              '',
              'def test_上限を超えると拒否される():',
              '    limiter = RateLimiter(max_requests=2, time_window=60)',
              '',
              '    assert limiter.check_rate_limit("1.2.3.4")[0] is True',
              '    assert limiter.check_rate_limit("1.2.3.4")[0] is True',
              '    assert limiter.check_rate_limit("1.2.3.4")[0] is False',
              '',
              '',
              'def test_クライアントごとに独立して数える():',
              '    limiter = RateLimiter(max_requests=1, time_window=60)',
              '',
              '    assert limiter.check_rate_limit("1.1.1.1")[0] is True',
              '    assert limiter.check_rate_limit("2.2.2.2")[0] is True   # 別 IP は影響を受けない',
              '',
              '',
              'def test_残り回数が返る():',
              '    limiter = RateLimiter(max_requests=3, time_window=60)',
              '',
              '    _, info = limiter.check_rate_limit("1.2.3.4")',
              '    assert info["remaining"] == 2',
            ],
          },
          {
            kind: 'list',
            title: '提出前の確認',
            items: [
              'ruff check . と ruff format --check . が通るか',
              'mypy が新しく書いた関数で警告を出していないか',
              'except に捕まえる例外を書いたか。裸の except: を残していないか',
              '外から来た値を変換する箇所すべてに既定値があるか',
              'ログに個人情報・認証情報を出していないか',
              'async 関数の中で time.sleep や同期の boto3 呼び出しをしていないか',
            ],
          },
          {
            kind: 'note',
            tone: 'tip',
            title: '次に読むもの',
            body:
              '教材のセクション 11（GoogleSheetsReader と WebCrawlerScraper）は、ここまでの型・データクラス・' +
              'デコレータ・async が全部同時に出てくる総合問題になっている。5 問を終えてから読むと、' +
              '設計の意図が見えるようになるはず。',
          },
        ],
      },
    ],
  },
]
