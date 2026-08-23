import axios, { AxiosError } from 'axios';

/**
 * バックエンド API クライアント（アプリ内で唯一のもの）。
 *
 * 旧実装では services/api.ts と api/auth.js の2つが併存し、
 * VITE_API_URL の解釈が食い違っていた（一方は /api を含む前提、他方は含まない前提）。
 * ここでは「VITE_API_URL はオリジンのみ」に統一し、/api は本ファイルで付与する。
 *
 * 例: VITE_API_URL=https://api.example.com → https://api.example.com/api/auth/login
 */

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 末尾スラッシュと、誤って付けられた /api を取り除いて正規化する
const API_ORIGIN = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export const TOKEN_STORAGE_KEY = 'authToken';

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // Microsoft Edge のサードパーティ Cookie 制限に対応するため Cookie は使わない。
  // 認証は Sanctum の Bearer トークンで行う。
  withCredentials: false,
});

// --- トークン管理 -----------------------------------------------------------

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    /* プライベートブラウジング等で失敗しても致命的ではない */
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* noop */
  }
};

// --- インターセプター -------------------------------------------------------

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 401 を受けたときに呼ばれるハンドラ。AuthContext が登録する。 */
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      // 旧実装は window.location.href = '/login' としていたが、
      // このアプリに /login ルートは存在せず 404 になるため行わない。
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

// --- 共通の型 ---------------------------------------------------------------

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  organization: string | null;
  role: string | null;
  /**
   * 管理者か（サーバーの ADMIN_EMAILS で判定される）。
   *
   * 画面の出し分けにだけ使う。**権限そのものではない**。
   * 管理APIの可否はリクエストごとにサーバーが判定するため、
   * ここを書き換えても管理データは取得できない。
   */
  is_admin: boolean;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** HTTP ステータス。応答が無かった場合（通信エラー）は undefined */
  status?: number;
  /** バリデーションエラー（422）のフィールド別メッセージ */
  errors?: Record<string, string[]>;
}

/** axios のエラーを画面に出せる形へ正規化する */
export const toApiResult = (error: unknown): ApiResult<never> => {
  const axiosError = error as AxiosError<{
    message?: string;
    errors?: Record<string, string[]>;
  }>;

  if (axiosError.response) {
    return {
      success: false,
      error: axiosError.response.data?.message ?? '通信エラーが発生しました',
      status: axiosError.response.status,
      errors: axiosError.response.data?.errors,
    };
  }
  if (axiosError.request) {
    return { success: false, error: 'サーバーに接続できませんでした' };
  }
  return { success: false, error: '予期しないエラーが発生しました' };
};

// --- 認証 -------------------------------------------------------------------

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  organization?: string;
  role?: string;
}

export const authAPI = {
  register: (payload: RegisterPayload) =>
    api.post<{ status: string; message: string; user: ApiUser; token: string }>(
      '/auth/register',
      payload,
    ),

  login: (payload: { email: string; password: string }) =>
    api.post<{ status: string; message: string; user: ApiUser; token: string }>(
      '/auth/login',
      payload,
    ),

  logout: () => api.post<{ status: string; message: string }>('/auth/logout'),

  me: () => api.get<{ status: string; user: ApiUser }>('/auth/me'),

  updateProfile: (payload: Partial<Pick<ApiUser, 'name' | 'organization' | 'role'>>) =>
    api.put<{ status: string; user: ApiUser }>('/auth/profile', payload),

  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.post<{ status: string; message: string }>('/auth/change-password', payload),
};

// --- お問い合わせ -----------------------------------------------------------

export interface ContactPayload {
  name: string;
  email: string;
  organization?: string;
  role?: string;
  subject: string;
  message: string;
  contactMethod?: 'email' | 'phone' | 'both';
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
}

export const contactAPI = {
  send: (payload: ContactPayload) =>
    api.post<{
      status: string;
      message: string;
      contact_id: string;
      submitted_at: string;
    }>('/contact', payload),
};

// --- 面談予約 ---------------------------------------------------------------

/**
 * 面談予約は /contact ではなく専用のエンドポイントを使う。
 *
 * 以前は予約内容を問い合わせ本文のテキストへ組み立てて /contact へ送っていた。
 * 保存はされていたが、希望日時が本文の一部でしかないため
 * 「明日の予約」を検索することも、枠の重複を検知することもできなかった。
 */

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface AppointmentPayload {
  name: string;
  email: string;
  phone: string;
  company: string;
  department?: string;
  position?: string;
  /** サーバー側の CONSULTATION_TYPES のキー */
  consultationType: string;
  /** YYYY-MM-DD */
  preferredDate: string;
  /** '10:00-11:00' 形式 */
  preferredTime: string;
  message?: string;
}

export interface AppointmentCreatedResponse {
  status: string;
  message: string;
  reference: string;
  preferred_date: string;
  preferred_slot: string;
  appointment_status: AppointmentStatus;
  submitted_at: string;
}

export interface SlotAvailability {
  slot: string;
  available: boolean;
}

export interface AvailabilityResponse {
  status: string;
  date: string;
  /** その日自体が受付可能か（平日・期間内か） */
  bookable: boolean;
  /** 受付できない場合の理由 */
  reason: string | null;
  slots: SlotAvailability[];
}

export interface AppointmentSummary {
  reference: string;
  name: string;
  email: string;
  company: string;
  consultation_type: string;
  consultation_label: string;
  preferred_date: string;
  preferred_slot: string;
  status: AppointmentStatus;
  ack_sent: boolean;
  staff_notified: boolean;
  /** 確定・取消を申込者へ知らせた日時。null なら知らせていない */
  status_notice_sent_at: string | null;
  created_at: string;
}

export interface AppointmentDetail extends AppointmentSummary {
  phone: string;
  department: string | null;
  position: string | null;
  message: string | null;
  staff_note: string | null;
  confirmed_at: string | null;
  user_id: number | null;
}

export interface AppointmentListResponse {
  status: string;
  total: number;
  items: AppointmentSummary[];
}

export const appointmentAPI = {
  /** 申し込み。未認証で呼べる */
  create: (payload: AppointmentPayload) =>
    api.post<AppointmentCreatedResponse>('/appointments', payload),

  /** 指定日の空き枠。未認証で呼べる */
  availability: (date: string) =>
    api.get<AvailabilityResponse>('/appointments/availability', { params: { date } }),

  // --- ここから管理者（ADMIN_EMAILS）専用。管理者以外は 403 が返る ---

  list: (params: { status?: AppointmentStatus; upcoming?: boolean; limit?: number; offset?: number }) =>
    api.get<AppointmentListResponse>('/appointments', { params }),

  get: (reference: string) => api.get<AppointmentDetail>(`/appointments/${reference}`),

  /**
   * 状態・担当者メモの更新。
   *
   * 確定・取消にすると、申込者へその旨のメールが自動で送られる（notify の既定は true）。
   * 電話などで既に伝えてある場合は notify: false を渡す。
   * メールは同期送信のため、この呼び出しは数十秒かかることがある。
   */
  update: (
    reference: string,
    payload: { status?: AppointmentStatus; staff_note?: string; notify?: boolean },
  ) => api.patch<AppointmentDetail>(`/appointments/${reference}`, payload, { timeout: 60_000 }),
};

// --- AI 資料生成 ------------------------------------------------------------

/**
 * OpenAI 呼び出しは必ずバックエンド経由で行う。
 *
 * 旧実装はブラウザから公開 CORS プロキシ（corsproxy.io 等）へ
 * API キー付きのリクエストを送っており、キーが第三者へ渡っていた。
 * また VITE_OPENAI_API_KEY はビルド成果物に埋め込まれ、誰でも読み取れた。
 * このため、フロントエンドは一切 API キーを持たない設計に変更している。
 */
export const openaiAPI = {
  generate: (payload: { prompt: string; userInfo: Record<string, string> }) =>
    api.post<{ success: boolean; content: string }>('/openai/generate', payload),
};

// --- AI資料のメール送付 -----------------------------------------------------

export interface DocumentRequestPayload {
  companyName: string;
  lastName: string;
  firstName: string;
  email: string;
  industry?: string;
  dept?: string;
  role?: string;
  additionalRequirements?: string;
}

export interface DocumentResponse {
  status: string;
  message: string;
  reference: string;
  /** 節キー → 本文。表示内容とメールの内容は一致する */
  content: Record<string, string>;
  email_sent: boolean;
}

/**
 * 資料ダウンロードフォーム専用のエンドポイント。
 *
 * /openai/generate と違い未認証で呼べる。その代わりプロンプトは送らず、
 * フォームの入力値だけを送る（プロンプトはサーバー側で組み立てられる）。
 * 生成した資料は、ここで送った email 宛にサーバーから送信される。
 */
export const documentAPI = {
  request: (payload: DocumentRequestPayload) =>
    // 生成（OpenAI待ち）とSMTP送信を1リクエストで行うため、
    // 既定の30秒では足りない。ここだけタイムアウトを延ばす。
    api.post<DocumentResponse>('/documents', payload, { timeout: 120_000 }),
};

export default api;
