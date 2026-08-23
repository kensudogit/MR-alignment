/**
 * 事業者情報。サイト全体で参照する唯一の定義。
 *
 * ★公開前に必ず実在の値を入れること。
 *   空のままの項目は、法定表記ページ（/legal）で「要記入」と赤字表示され、
 *   電話番号が空なら電話の導線そのものが表示されない。
 *   ダミーの番号や住所を置かないための作りなので、値を入れずに埋め草を書かないこと。
 *
 * ここを直すと、フッタ・法定表記・構造化データ（JSON-LD）が同時に変わる。
 */

export interface SiteInfo {
  /** 屋号（表示名） */
  name: string;
  /** 事業者名（法定表記に使う正式名称。屋号と同じならそのまま） */
  legalName: string;
  /** 代表者名 */
  representative: string;
  /** 郵便番号（例: 100-0001） */
  postalCode: string;
  /** 所在地 */
  address: string;
  /** 電話番号（ハイフン区切り）。空なら電話の導線を出さない */
  tel: string;
  /** 問い合わせ用メールアドレス */
  email: string;
  /** 受付時間 */
  businessHours: string;
  /** 公開URL（OGP・canonical・sitemap に使う） */
  url: string;
  /**
   * 郵便番号・番地・電話番号をサイト上に載せず、請求があったときに開示する運用にするか。
   *
   * true にすると、/legal では該当項目を「要記入」ではなく
   * 「ご請求により遅滞なく開示します」と表示する（特定商取引法の広告における省略の扱い）。
   * 開示を求められたら、必ず遅滞なくメールで回答すること。
   * サイトに載せられるなら false にして実際の値を書くほうが、取引先の与信では有利。
   */
  discloseContactOnRequest: boolean;
}

export const siteInfo: SiteInfo = {
  name: '須藤技術士事務所',
  legalName: '須藤技術士事務所',
  representative: '須藤 憲一',
  postalCode: '',
  address: '東京都三鷹市',
  tel: '',
  email: 'kensudo@jcom.zaq.ne.jp',
  businessHours: '平日 9:00〜18:00（土日祝を除く）',
  url: 'https://mr-alignment-production.up.railway.app',
  discloseContactOnRequest: true,
};

/** 電話の導線を出してよいか（実在の番号が入っているときだけ true） */
export const hasPhone = (): boolean => siteInfo.tel.trim() !== '';

/** メールの導線を出してよいか */
export const hasEmail = (): boolean => siteInfo.email.trim() !== '';

/** tel: リンク用に記号を落とした番号 */
export const telHref = (): string => `tel:${siteInfo.tel.replace(/[^\d+]/g, '')}`;

/**
 * 法定表記に必要な項目のうち、未記入のものを返す。
 *
 * 郵便番号と電話番号は `discloseContactOnRequest` が true なら請求時開示の扱いとし、
 * 未記入でも警告しない。事業者名・代表者・所在地・メールアドレスは、
 * 連絡手段そのものなので省略できない。
 */
export const missingLegalFields = (): string[] => {
  const required: [keyof SiteInfo, string][] = [
    ['legalName', '事業者名'],
    ['representative', '代表者'],
    ['address', '所在地'],
    ['email', 'メールアドレス'],
  ];
  if (!siteInfo.discloseContactOnRequest) {
    required.push(['postalCode', '郵便番号'], ['tel', '電話番号']);
  }
  return required
    .filter((entry) => String(siteInfo[entry[0]]).trim() === '')
    .map(([, label]) => label);
};
