import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { siteInfo, missingLegalFields } from '../config/site'

/** 未記入のとき、赤字の「要記入」の代わりに出す説明（請求時開示の運用） */
const DISCLOSE_ON_REQUEST = 'ご請求いただければ、遅滞なくメールにて開示します'

/**
 * 法定表記・事業者情報（/legal）
 *
 * このサイトは氏名・会社名・メールアドレスを取得するフォームを公開しているため、
 * 利用目的を公表するページが必要になる。フッタの3リンクは、以前は
 * ハンドラのない <button> で、押しても何も起きなかった。
 *
 * 記載内容は src/config/site.ts の値から組み立てる。未記入の項目は
 * 「要記入」と赤字で出るので、公開前に site.ts を埋めること。
 * ここに直接ダミーの住所や番号を書かないこと。
 */

const UPDATED_ON = '2026-08-23'

/**
 * 未記入なら赤字の「要記入」を出す。埋め草を表示しないための共通処理。
 * fallback を渡した項目（請求時開示にするもの）だけは、その説明を灰字で出す。
 */
const Value = ({ children, fallback }: { children: string; fallback?: string }) => {
  if (children.trim() !== '') return <span className="text-gray-900">{children}</span>
  if (fallback) return <span className="text-gray-600">{fallback}</span>
  return <span className="font-semibold text-red-600">要記入（site.ts）</span>
}

const Row = ({
  label,
  value,
  fallback,
}: {
  label: string
  value: string
  fallback?: string
}) => (
  <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 last:border-0 sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-semibold text-gray-500">{label}</dt>
    <dd className="text-sm leading-relaxed sm:col-span-2">
      <Value fallback={fallback}>{value}</Value>
    </dd>
  </div>
)

const Section = ({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) => (
  <section id={id} className="mt-10 scroll-mt-28">
    <h2 className="text-xl font-extrabold text-gray-900 md:text-2xl">{title}</h2>
    <div className="glass-card mt-4 rounded-3xl p-6 md:p-8">{children}</div>
  </section>
)

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-sm leading-relaxed text-gray-700 first:mt-0">{children}</p>
)

const List = ({ items }: { items: string[] }) => (
  <ul className="mt-3 space-y-2">
    {items.map((item) => (
      <li key={item} className="flex gap-2 text-sm leading-relaxed text-gray-700">
        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-healthcare-500" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
)

export default function LegalPage() {
  useEffect(() => {
    const previous = document.title
    document.title = `事業者情報・プライバシーポリシー | ${siteInfo.name}`
    return () => {
      document.title = previous
    }
  }, [])

  const missing = missingLegalFields()
  const disclosure = siteInfo.discloseContactOnRequest ? DISCLOSE_ON_REQUEST : undefined
  const fullAddress = [siteInfo.postalCode && `〒${siteInfo.postalCode}`, siteInfo.address]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="min-h-screen bg-gradient-healthcare">
      <header className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="metallic-container flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
              <img src="/PC.png" alt={siteInfo.name} className="relative z-10 h-12 w-12 object-contain" />
            </div>
            <span className="text-sm font-bold gradient-text">{siteInfo.name}</span>
          </Link>
          <Link to="/" className="btn-secondary">
            トップへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        <h1 className="text-3xl font-extrabold text-gray-900 md:text-4xl">事業者情報・法定表記</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          最終更新: {UPDATED_ON}
        </p>

        {missing.length > 0 && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-700">
              このページは未完成です（{missing.join('・')} が未記入）
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-700">
              <code className="rounded bg-white/70 px-1">frontend/src/config/site.ts</code> に実在の値を入れると、この警告は消えます。
              記入するまでは、この状態でサイトを公開しないでください。
            </p>
          </div>
        )}

        <nav className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#business" className="text-healthcare-600 underline-offset-4 hover:underline">
            事業者情報
          </a>
          <a href="#privacy" className="text-healthcare-600 underline-offset-4 hover:underline">
            プライバシーポリシー
          </a>
          <a href="#tokushoho" className="text-healthcare-600 underline-offset-4 hover:underline">
            特定商取引法に基づく表記
          </a>
          <a href="#terms" className="text-healthcare-600 underline-offset-4 hover:underline">
            利用規約
          </a>
        </nav>

        <Section id="business" title="事業者情報">
          <dl>
            <Row label="事業者名" value={siteInfo.legalName} />
            <Row label="代表者" value={siteInfo.representative} />
            <Row label="所在地" value={fullAddress} fallback={disclosure} />
            <Row label="電話番号" value={siteInfo.tel} fallback={disclosure} />
            <Row label="メールアドレス" value={siteInfo.email} />
            <Row label="受付時間" value={siteInfo.businessHours} />
            <Row
              label="事業内容"
              value="生成AI・AIエージェント開発、業務システム・Webアプリ開発、データ活用・分析基盤、クラウド基盤・運用、レガシー移行、コーディングエージェント導入支援"
            />
          </dl>
          {siteInfo.discloseContactOnRequest && (
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              郵便番号・番地・電話番号は本サイト上には掲載していません。
              {siteInfo.email ? `${siteInfo.email} 宛に` : 'お問い合わせフォームから'}
              ご請求いただければ、遅滞なくメールにて開示します。
            </p>
          )}
        </Section>

        <Section id="privacy" title="プライバシーポリシー">
          <Paragraph>
            {siteInfo.name}（以下「当事務所」）は、本サイトを通じて取得する個人情報を、
            以下の方針に従って取り扱います。
          </Paragraph>

          <h3 className="mt-6 text-base font-bold text-gray-900">1. 取得する情報</h3>
          <Paragraph>本サイトのフォームからは、次の情報を取得します。</Paragraph>
          <List
            items={[
              '資料ダウンロードフォーム: 業界、会社名、部署、役職、氏名、メールアドレス、ご要望',
              'お問い合わせ・面談予約フォーム: 氏名、メールアドレス、会社名、役職、ご相談内容、ご希望の連絡方法',
              '会員登録をご利用の場合: 氏名、メールアドレス、所属、役職、パスワード（不可逆なハッシュ値のみを保存し、平文では保存しません）',
              '送信時のIPアドレスおよびブラウザ情報（不正利用の防止のため）',
            ]}
          />

          <h3 className="mt-6 text-base font-bold text-gray-900">2. 利用目的</h3>
          <List
            items={[
              'ご請求いただいた資料の作成および送付',
              'お問い合わせ・ご予約への回答および連絡',
              'ご相談内容に応じたサービスのご案内',
              '本サイトおよびサービスの品質改善',
            ]}
          />

          <h3 className="mt-6 text-base font-bold text-gray-900">3. 外部サービスへの提供</h3>
          <Paragraph>
            資料ダウンロードフォームおよびチャット相談では、入力内容をもとに文章を生成するため、
            OpenAI, L.L.C. の API に入力内容を送信します。生成された資料および入力内容は、
            当事務所のデータベースに保存し、資料の品質改善に利用します。
            これ以外の第三者へは、法令に基づく場合を除き、ご本人の同意なく提供しません。
          </Paragraph>
          <Paragraph>
            機密情報や個人の秘密に関わる内容は、フォームに入力しないでください。
          </Paragraph>

          <h3 className="mt-6 text-base font-bold text-gray-900">4. Cookie・アクセス解析</h3>
          <Paragraph>
            本サイトは、広告・解析目的の Cookie を使用していません。
            ログイン状態の保持には、同一オリジンの localStorage のみを使用します。
            アクセス解析ツールも導入していません。
          </Paragraph>

          <h3 className="mt-6 text-base font-bold text-gray-900">5. 保存期間と管理</h3>
          <Paragraph>
            取得した情報は、利用目的の達成に必要な期間保存し、不要になった時点で削除します。
            通信は TLS で暗号化し、認証情報を含むデータへのアクセスは当事務所の担当者に限定します。
          </Paragraph>

          <h3 className="mt-6 text-base font-bold text-gray-900">6. 開示・訂正・削除のご請求</h3>
          <Paragraph>
            ご本人からの開示・訂正・利用停止・削除のご請求には、ご本人であることを確認したうえで、
            合理的な期間内に対応します。ご連絡は上記のメールアドレス、または
            <Link to="/#contact" className="text-healthcare-600 underline underline-offset-4">
              お問い合わせフォーム
            </Link>
            からお願いします。
          </Paragraph>
        </Section>

        <Section id="tokushoho" title="特定商取引法に基づく表記">
          <Paragraph>
            本サイト上での役務（ITコンサルティング・システム開発等）の提供に関する表記です。
            資料のダウンロードおよびご相談は無料です。
          </Paragraph>
          <dl className="mt-4">
            <Row label="販売事業者" value={siteInfo.legalName} />
            <Row label="運営統括責任者" value={siteInfo.representative} />
            <Row label="所在地" value={fullAddress} fallback={disclosure} />
            <Row label="電話番号" value={siteInfo.tel} fallback={disclosure} />
            <Row label="メールアドレス" value={siteInfo.email} />
            <Row
              label="役務の対価"
              value="個別のお見積りによります。ご相談内容をお伺いしたうえで、作業範囲と金額を記載した見積書を提示します。"
            />
            <Row label="対価以外の必要料金" value="本サイトの閲覧・資料請求・ご相談に費用はかかりません。" />
            <Row label="支払方法・支払時期" value="銀行振込。個別契約で定めた時期にお支払いいただきます。" />
            <Row label="役務の提供時期" value="個別契約で定めた期日によります。" />
            <Row
              label="キャンセル・返金"
              value="契約後のキャンセルおよび返金の取り扱いは、個別契約の定めによります。"
            />
          </dl>
          {siteInfo.discloseContactOnRequest && (
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              郵便番号・番地・電話番号は本サイト上には掲載していません。
              {siteInfo.email ? `${siteInfo.email} 宛に` : 'お問い合わせフォームから'}
              ご請求いただければ、遅滞なくメールにて開示します。
            </p>
          )}
        </Section>

        <Section id="terms" title="利用規約">
          <h3 className="text-base font-bold text-gray-900">1. 適用</h3>
          <Paragraph>
            本規約は、本サイトの利用に関する条件を定めるものです。本サイトを利用された方は、
            本規約に同意したものとみなします。
          </Paragraph>

          <h3 className="mt-6 text-base font-bold text-gray-900">2. 生成AIによる資料について</h3>
          <Paragraph>
            本サイトの資料生成およびチャット相談は、生成AIによる出力を含みます。
            出力には誤りが含まれることがあり、内容の正確性・完全性を保証するものではありません。
            提案・見積り・契約の根拠として用いる場合は、必ず当事務所の担当者にご確認ください。
          </Paragraph>

          <h3 className="mt-6 text-base font-bold text-gray-900">3. 禁止事項</h3>
          <List
            items={[
              '本サイトの機能を、資料請求・ご相談以外の目的で自動的・反復的に利用すること',
              '第三者の権利を侵害する内容、または虚偽の情報を送信すること',
              '本サイトの運営を妨げる行為',
            ]}
          />

          <h3 className="mt-6 text-base font-bold text-gray-900">4. 免責</h3>
          <Paragraph>
            本サイトに掲載する情報および外部リンク先の内容について、当事務所は
            その利用によって生じた損害の責任を負いません。
            本サイトの提供は、予告なく中断・変更されることがあります。
          </Paragraph>

          <h3 className="mt-6 text-base font-bold text-gray-900">5. 準拠法・管轄</h3>
          <Paragraph>
            本規約は日本法に準拠し、本サイトに関して紛争が生じた場合は、
            当事務所の所在地を管轄する裁判所を専属的合意管轄とします。
          </Paragraph>
        </Section>

        <div className="mt-10 text-center">
          <Link to="/" className="btn-gradient">
            トップページへ戻る
          </Link>
        </div>
      </main>
    </div>
  )
}
