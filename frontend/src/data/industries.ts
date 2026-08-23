/**
 * 業種・職種の選択肢。フォーム間で表記を揃えるための唯一の定義。
 *
 * 以前はフォームごとに選択肢を直書きしており、お問い合わせフォームには
 * 「病院・クリニック・薬局」「医師・看護師・薬剤師」という、
 * このサイトの事業（ITコンサルティング）と無関係な項目が残っていた。
 * 別テンプレートから持ち込まれたまま、導線がなく開かれないモーダルだったため
 * 気づかれていなかったもの。
 *
 * `value` は資料生成 API（`POST /api/documents`）がそのまま受け取り、
 * バックエンドの `INDUSTRY_LABELS`（`backend/app/services/document.py`）で
 * 日本語へ戻してプロンプトとメールに使う。**両者のキーは必ず一致させること。**
 * 一致していないと、生成される資料に英語のキーがそのまま載る。
 */

export interface Option {
  value: string;
  label: string;
}

/** 業種。開発実績として公開している領域を先に並べている。 */
export const INDUSTRY_OPTIONS: Option[] = [
  { value: 'manufacturing', label: '製造業' },
  { value: 'finance', label: '金融・保険' },
  { value: 'retail', label: '小売・EC・D2C' },
  { value: 'energy', label: 'エネルギー・インフラ' },
  { value: 'construction', label: '建設・不動産' },
  { value: 'logistics', label: '運輸・物流' },
  { value: 'it', label: 'IT・情報通信' },
  { value: 'media', label: 'メディア・広告' },
  { value: 'healthcare', label: '医療・ヘルスケア' },
  { value: 'education', label: '教育・研究機関' },
  { value: 'government', label: '官公庁・自治体' },
  { value: 'other', label: 'その他' },
];

/**
 * 職種。相談相手が誰かで、話す内容も見積りの粒度も変わるため、
 * 医療職ではなく「システムを発注する側の立場」で分けている。
 */
export const ROLE_OPTIONS: Option[] = [
  { value: '経営者・役員', label: '経営者・役員' },
  { value: '情報システム部門', label: '情報システム部門' },
  { value: '開発・エンジニア', label: '開発・エンジニア' },
  { value: '事業部門・企画', label: '事業部門・企画' },
  { value: '製造・現場部門', label: '製造・現場部門' },
  { value: '管理部門（総務・経理・人事）', label: '管理部門（総務・経理・人事）' },
  { value: 'その他', label: 'その他' },
];

/** 業種のキーから日本語表記を引く（未知のキーはそのまま返す） */
export const industryLabel = (value: string): string =>
  INDUSTRY_OPTIONS.find((o) => o.value === value)?.label ?? value;
