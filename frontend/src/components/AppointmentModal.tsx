import React, { useCallback, useEffect, useState } from 'react';
import {
  appointmentAPI,
  toApiResult,
  type AppointmentPayload,
  type SlotAvailability,
} from '../services/api';
import { siteInfo, hasEmail } from '../config/site';
import './AppointmentModal.css';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 相談内容の選択肢。値はサーバー側の CONSULTATION_TYPES のキーと一致させること */
const CONSULTATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'system-development', label: 'システム開発' },
  { value: 'digital-transformation', label: 'デジタル変革' },
  { value: 'cloud-migration', label: 'クラウド移行' },
  { value: 'security', label: 'セキュリティ対策' },
  { value: 'data-analysis', label: 'データ分析' },
  { value: 'it-strategy', label: 'IT戦略' },
  { value: 'other', label: 'その他' },
];

/**
 * 時間帯の初期値。
 * 日付を選ぶとサーバーから空き状況を取り直すので、これは日付未選択時の表示にすぎない。
 * 選択肢そのものはサーバー（app/services/appointment.py の TIME_SLOTS）が持っている。
 */
const DEFAULT_SLOTS: SlotAvailability[] = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
].map((slot) => ({ slot, available: true }));

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  department: '',
  position: '',
  preferredDate: '',
  preferredTime: '',
  consultationType: '',
  message: '',
};

/** date 入力の下限。過去日を選べないようにする（サーバー側でも弾く） */
const todayIso = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  // 文言で成否を判定していたため、送信失敗が success 表示になり得た。状態で持つ。
  const [isSuccess, setIsSuccess] = useState(false);

  // 空き枠。日付を選ぶたびにサーバーへ問い合わせる
  const [slots, setSlots] = useState<SlotAvailability[]>(DEFAULT_SLOTS);
  const [dateNotice, setDateNotice] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * 選ばれた日の空き枠を取り直す。
   *
   * 空き判定を画面側に書くとサーバーの判定とずれ、
   * 「選べるのに送信すると弾かれる」ことになるため、必ずサーバーに聞く。
   */
  const loadAvailability = useCallback(async (date: string) => {
    if (!date) {
      setSlots(DEFAULT_SLOTS);
      setDateNotice('');
      return;
    }

    setIsLoadingSlots(true);
    try {
      const { data } = await appointmentAPI.availability(date);
      setSlots(data.slots);
      setDateNotice(
        data.bookable
          ? data.slots.every((s) => !s.available)
            ? 'この日は満席です。別の日をお選びください。'
            : ''
          : (data.reason ?? 'この日は受け付けておりません。'),
      );

      // 選択済みの枠が埋まっていたら選び直してもらう
      setFormData((prev) =>
        prev.preferredTime &&
        !data.slots.some((s) => s.slot === prev.preferredTime && s.available)
          ? { ...prev, preferredTime: '' }
          : prev,
      );
    } catch {
      // 空き状況が取れなくても申し込み自体は行える（送信時にサーバーが再確認する）
      setSlots(DEFAULT_SLOTS);
      setDateNotice('空き状況を取得できませんでした。そのままお申し込みいただけます。');
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadAvailability(formData.preferredDate);
  }, [isOpen, formData.preferredDate, loadAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setIsSuccess(false);

    try {
      // 以前はここで予約内容をテキストに組み立てて /api/contact へ送っていた。
      // 保存はされるが、希望日時が本文の一部でしかないため日付で検索できず、
      // 枠の重複も検知できなかった。専用エンドポイントへ構造化して送る。
      const { data } = await appointmentAPI.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        department: formData.department || undefined,
        position: formData.position || undefined,
        consultationType: formData.consultationType,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        message: formData.message || undefined,
      } satisfies AppointmentPayload);

      setIsSuccess(true);
      setSubmitMessage(
        `${data.message}（受付番号: ${data.reference}）` +
          `\n${data.preferred_date} ${data.preferred_slot} で承りました。` +
          '\n控えのメールが届かない場合は、迷惑メールフォルダをご確認ください。',
      );

      setFormData(EMPTY_FORM);
      setSlots(DEFAULT_SLOTS);
      setDateNotice('');
    } catch (error) {
      // 送信できていないのに成功を装わない。連絡先を添えて、別手段を案内する。
      const result = toApiResult(error);
      const fieldMessage = result.errors ? Object.values(result.errors).flat()[0] : undefined;
      setSubmitMessage(
        `${fieldMessage || result.error || '送信できませんでした。'}${
          hasEmail() ? ` お急ぎの場合は ${siteInfo.email} まで直接ご連絡ください。` : ''
        }`,
      );
      // 枠が埋まっていた場合、最新の空き状況に更新して選び直せるようにする
      void loadAvailability(formData.preferredDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="appointment-modal-overlay" onClick={onClose}>
      <div className="appointment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="appointment-modal-header">
          <h2 className="appointment-modal-title">面談予約</h2>
          <button className="appointment-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="appointment-modal-body">
          <p className="appointment-description">
            専門のITコンサルタントとの面談を予約いただけます。<br />
            {siteInfo.businessHours}の枠からお選びください。
          </p>

          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">お名前 *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">メールアドレス *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">電話番号 *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="company">会社名 *</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">部署</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="position">役職</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="consultationType">相談内容 *</label>
                <select
                  id="consultationType"
                  name="consultationType"
                  value={formData.consultationType}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">選択してください</option>
                  {CONSULTATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="preferredDate">希望日 *</label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  min={todayIso()}
                  required
                  className="form-input"
                />
                {dateNotice && <p className="form-note">{dateNotice}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="preferredTime">
                希望時間 *{isLoadingSlots && <span className="form-note-inline">空き状況を確認中…</span>}
              </label>
              <select
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">選択してください</option>
                {slots.map(({ slot, available }) => (
                  <option key={slot} value={slot} disabled={!available}>
                    {slot}
                    {available ? '' : '（予約済み）'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">ご要望・ご質問</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="form-input"
                placeholder="面談でお聞きになりたい内容やご要望をお聞かせください"
              />
            </div>

            {submitMessage && (
              <div className={`submit-message ${isSuccess ? 'success' : 'error'}`}>
                {submitMessage}
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-cancel">
                キャンセル
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-submit">
                {isSubmitting ? '送信中...' : '予約申し込み'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
