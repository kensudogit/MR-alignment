import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../contexts/AuthContext'
import { siteInfo } from '../config/site'
import {
  appointmentAPI,
  toApiResult,
  type AppointmentDetail,
  type AppointmentStatus,
  type AppointmentSummary,
} from '../services/api'

/**
 * 面談予約の管理（/admin/appointments）
 *
 * これが無かった間、担当者が予約に気づく手段は通知メールだけだった。
 * メールが埋もれる・SMTP が失敗する・CONTACT_MAIL_TO が未設定、のいずれでも
 * 予約は DB に入ったまま誰にも見られない状態になる。
 *
 * このページは API が権限を判定した結果をそのまま表示する。
 * 画面側で管理者かどうかを判定して出し分けることはしない
 * （画面の分岐は開発者ツールで越えられるため、判定はサーバーに置く）。
 * 管理者は環境変数 ADMIN_EMAILS で指定する。
 */

const PAGE_SIZE = 50

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: '未確定',
  confirmed: '確定',
  cancelled: 'キャンセル',
  completed: '実施済み',
}

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-200 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
}

const STATUS_ORDER: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled']

/** 申込者へ自動でメールを送る状態。サーバー側の _STATUS_NOTICES と対応させること */
const NOTIFIED_STATUSES: AppointmentStatus[] = ['confirmed', 'cancelled']

const StatusBadge = ({ status }: { status: AppointmentStatus }) => (
  <span
    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASSES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
)

/** 送信できていないメールを見つけられるようにする。「送ったつもり」を可視化する */
const MailFlag = ({ label, sent }: { label: string; sent: boolean }) => (
  <span className={`text-xs ${sent ? 'text-gray-500' : 'font-bold text-red-600'}`}>
    {label}: {sent ? '送信済' : '未送信'}
  </span>
)

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${y}/${m}/${d}`
}

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })

const AdminAppointmentsPage = () => {
  const { isAuthenticated, isLoading: isAuthLoading, user, logout } = useAuth()

  const [items, setItems] = useState<AppointmentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('')
  const [upcoming, setUpcoming] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isForbidden, setIsForbidden] = useState(false)

  const [selected, setSelected] = useState<AppointmentDetail | null>(null)
  const [staffNote, setStaffNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [detailMessage, setDetailMessage] = useState('')
  // 確定・キャンセルを申込者へ知らせるか。既定は「知らせる」
  const [notify, setNotify] = useState(true)

  const [loginOpen, setLoginOpen] = useState(false)

  const load = useCallback(async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setError('')
    setIsForbidden(false)
    try {
      const { data } = await appointmentAPI.list({
        status: statusFilter || undefined,
        upcoming: upcoming || undefined,
        limit: PAGE_SIZE,
        offset,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      const result = toApiResult(err)
      // 403 は「ログインはできているが管理者ではない」。案内の文面を分ける
      setIsForbidden(result.status === 403)
      setError(result.error ?? '一覧を取得できませんでした')
      setItems([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, statusFilter, upcoming, offset])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (reference: string) => {
    setDetailMessage('')
    try {
      const { data } = await appointmentAPI.get(reference)
      setSelected(data)
      setStaffNote(data.staff_note ?? '')
    } catch (err) {
      setDetailMessage(toApiResult(err).error ?? '詳細を取得できませんでした')
    }
  }

  const update = async (payload: {
    status?: AppointmentStatus
    staff_note?: string
    notify?: boolean
  }) => {
    if (!selected) return

    setIsSaving(true)
    setDetailMessage('')
    try {
      const { data } = await appointmentAPI.update(selected.reference, payload)
      setSelected(data)
      setStaffNote(data.staff_note ?? '')

      // メールを送るはずだったのに送れていない場合は、はっきり伝える。
      // 「更新しました」だけだと、担当者は連絡が済んだと思い込んでしまう。
      const shouldHaveNotified =
        payload.notify !== false &&
        (payload.status === 'confirmed' || payload.status === 'cancelled')
      setDetailMessage(
        shouldHaveNotified && !data.status_notice_sent_at
          ? `状態は「${STATUS_LABELS[data.status]}」に変更しましたが、申込者へのメールを送信できませんでした。個別にご連絡ください。`
          : shouldHaveNotified
            ? `状態を「${STATUS_LABELS[data.status]}」に変更し、申込者へメールでお知らせしました。`
            : '更新しました',
      )
      await load()
    } catch (err) {
      setDetailMessage(toApiResult(err).error ?? '更新できませんでした')
    } finally {
      setIsSaving(false)
    }
  }

  // ------------------------------------------------------------------ 未ログイン

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-healthcare p-10 text-center text-gray-600">
        読み込み中…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-healthcare">
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900">面談予約の管理</h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            この画面を開くには、管理者アカウントでのログインが必要です。
          </p>
          <button className="btn-gradient mt-8" onClick={() => setLoginOpen(true)}>
            ログイン
          </button>
          <div className="mt-6">
            <Link to="/" className="text-sm text-healthcare-600 underline underline-offset-4">
              トップへ戻る
            </Link>
          </div>
        </main>
        <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} mode="login" />
      </div>
    )
  }

  // ------------------------------------------------------------------ 本体

  const page = Math.floor(offset / PAGE_SIZE) + 1
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-gradient-healthcare">
      <header className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-sm font-bold gradient-text">
            {siteInfo.name}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-600 sm:inline">{user?.email}</span>
            <button className="btn-secondary" onClick={() => void logout()}>
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">面談予約の管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          申し込みは「未確定」で入ります。空き状況を確認して「確定」にすると、
          確定した旨のメールが申込者へ自動で届きます。
        </p>

        {/* ------------------------------------------------------------ 絞り込み */}
        <div className="glass-card mt-6 flex flex-wrap items-center gap-4 rounded-2xl p-4">
          <label className="text-sm font-semibold text-gray-700">
            状態
            <select
              className="ml-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AppointmentStatus | '')
                setOffset(0)
              }}
            >
              <option value="">すべて</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={upcoming}
              onChange={(e) => {
                setUpcoming(e.target.checked)
                setOffset(0)
              }}
            />
            今日以降のみ（希望日の昇順）
          </label>

          <button className="btn-secondary ml-auto" onClick={() => void load()} disabled={isLoading}>
            {isLoading ? '読み込み中…' : '再読み込み'}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <p className="font-bold">{error}</p>
            {isForbidden && (
              <p className="mt-2 leading-relaxed">
                このアカウント（{user?.email}）は管理者として登録されていません。
                バックエンドの環境変数 <code className="font-mono">ADMIN_EMAILS</code> に
                このメールアドレスを追加してください（カンマ区切りで複数指定できます）。
              </p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------ 一覧 */}
        {!error && (
          <div className="glass-card mt-6 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">希望日時</th>
                  <th className="px-4 py-3">会社・お名前</th>
                  <th className="px-4 py-3">相談内容</th>
                  <th className="px-4 py-3">状態</th>
                  <th className="px-4 py-3">メール</th>
                  <th className="px-4 py-3">申込日時</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.reference} className="border-b border-gray-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                      {formatDate(item.preferred_date)}
                      <span className="ml-2 font-normal text-gray-600">{item.preferred_slot}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{item.company}</div>
                      <div className="text-xs text-gray-600">{item.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.consultation_label}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <MailFlag label="控え" sent={item.ack_sent} />
                        <MailFlag label="通知" sent={item.staff_notified} />
                        {/* 確定・キャンセルにしたのに連絡が行っていない行を見つけられるようにする */}
                        {NOTIFIED_STATUSES.includes(item.status) && (
                          <MailFlag
                            label={STATUS_LABELS[item.status]}
                            sent={item.status_notice_sent_at !== null}
                          />
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-sm font-semibold text-healthcare-600 underline underline-offset-4"
                        onClick={() => void openDetail(item.reference)}
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      該当する予約はありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!error && total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <button
              className="btn-secondary"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              前へ
            </button>
            <span>
              {page} / {lastPage} ページ（全 {total} 件）
            </span>
            <button
              className="btn-secondary"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              次へ
            </button>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------ 詳細 */}
      {selected && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  {formatDate(selected.preferred_date)} {selected.preferred_slot}
                </h2>
                <p className="mt-1 font-mono text-xs text-gray-500">{selected.reference}</p>
              </div>
              <button
                className="text-2xl leading-none text-gray-400 hover:text-gray-700"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ['状態', STATUS_LABELS[selected.status]],
                ['相談内容', selected.consultation_label],
                ['会社名', selected.company],
                ['お名前', selected.name],
                ['部署', selected.department ?? '（未記入）'],
                ['役職', selected.position ?? '（未記入）'],
                ['メール', selected.email],
                ['電話番号', selected.phone],
                ['申込日時', formatDateTime(selected.created_at)],
                ['確定日時', selected.confirmed_at ? formatDateTime(selected.confirmed_at) : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-gray-500">{label}</dt>
                  <dd className="mt-0.5 break-all text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5">
              <h3 className="text-xs font-semibold text-gray-500">ご要望・ご質問</h3>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-sm text-gray-800">
                {selected.message ?? '（記載なし）'}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              <MailFlag label="申込者への控え" sent={selected.ack_sent} />
              <MailFlag label="担当者への通知" sent={selected.staff_notified} />
              {NOTIFIED_STATUSES.includes(selected.status) && (
                <MailFlag
                  label={`${STATUS_LABELS[selected.status]}のご連絡`}
                  sent={selected.status_notice_sent_at !== null}
                />
              )}
            </div>

            {/* 状態の変更。キャンセルにすると枠が解放され、他の方が予約できるようになる */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-900">状態を変更</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    disabled={isSaving || s === selected.status}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      s === selected.status
                        ? 'cursor-default bg-gray-200 text-gray-500'
                        : 'bg-healthcare-600 text-white hover:bg-healthcare-700'
                    }`}
                    onClick={() => void update({ status: s, notify })}
                  >
                    {STATUS_LABELS[s]}にする
                  </button>
                ))}
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                />
                確定・キャンセルを申込者へメールで知らせる
              </label>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                「確定」「キャンセル」にすると、上のチェックが入っているあいだは
                申込者へ自動でメールが届きます（担当者メモは送られません）。
                電話などで既にお伝えしている場合はチェックを外してください。
                「未確定」「実施済み」への変更ではメールは送りません。
                キャンセルにすると、この枠は他の方が予約できるようになります。
                <br />
                メールの送信を待つため、確定・キャンセルの操作は数十秒かかることがあります。
              </p>
            </div>

            <div className="mt-6">
              <label className="text-sm font-bold text-gray-900" htmlFor="staff-note">
                担当者メモ（申込者には表示されません）
              </label>
              <textarea
                id="staff-note"
                className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
                rows={3}
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
              />
              <button
                className="btn-gradient mt-3"
                disabled={isSaving}
                onClick={() => void update({ staff_note: staffNote })}
              >
                {isSaving ? '保存中…' : 'メモを保存'}
              </button>
            </div>

            {detailMessage && (
              <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm text-gray-800">{detailMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAppointmentsPage
