import { documentAPI, openaiAPI, toApiResult } from './api';

import type { DocumentRequestPayload } from './api';

/**
 * AI 資料生成のプロンプト組み立てとレスポンス整形。
 *
 * 旧 utils/openaiClient.js が持っていた責務のうち、
 * 「API キーを持つ」「CORS プロキシを経由する」部分を削除し、
 * プロンプト生成と整形だけを残したもの。通信は必ず自社バックエンド経由。
 */

export interface UserInfo {
  name?: string;
  organization?: string;
  role?: string;
  industry?: string;
  email?: string;
  interest?: string;
  budget?: string;
}

export interface ProposalContent {
  serviceOverview: string;
  recommendedServices: string;
  expectedEffects: string;
  implementationSteps: string;
  supportSystem: string;
  riskManagement: string;
  investmentReturn: string;
  additionalRequirementsResponse?: string;
}

/** バックエンドが受け付けるキーだけに絞る（サーバー側でも同じ絞り込みを行う） */
const ALLOWED_KEYS: (keyof UserInfo)[] = [
  'name',
  'organization',
  'role',
  'industry',
  'email',
  'interest',
  'budget',
];

export const sanitizeUserInfo = (info: Record<string, unknown>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const value = info[key];
    if (typeof value === 'string' && value.trim() !== '') {
      out[key] = value.trim().slice(0, 255);
    }
  }
  return out;
};

export const buildProposalPrompt = (info: Record<string, string>): string => {
  const org = info.organization || 'お客様';
  const industry = info.industry || '該当業界';

  return [
    `${org}様（${industry}）向けのITサービス提案資料を作成してください。`,
    '',
    '次のキーを持つJSONオブジェクトのみを出力してください（前後に説明文を付けないこと）:',
    '- serviceOverview: サービス概要と業界分析',
    '- recommendedServices: 推奨サービス',
    '- expectedEffects: 期待される効果',
    '- implementationSteps: 導入ステップ',
    '- supportSystem: サポート体制',
    '- riskManagement: リスク管理',
    '- investmentReturn: 投資対効果',
    '',
    'すべての値は日本語の文字列とし、具体的かつ実務的に記述してください。',
  ].join('\n');
};

export const buildChatPrompt = (question: string): string =>
  [
    '以下のご質問に、ITコンサルタントとして親切かつ専門的に回答してください。',
    '',
    `ご質問: ${question}`,
    '',
    '回答のガイドライン:',
    '- 丁寧で分かりやすい日本語',
    '- 具体的で実用的なアドバイス',
    '- 必要に応じて確認事項を1つだけ質問する',
  ].join('\n');

/** モデル応答が JSON でない場合も画面が壊れないように整形する */
export const parseProposal = (raw: string): ProposalContent => {
  const fallback = (text: string): ProposalContent => ({
    serviceOverview: text,
    recommendedServices: '詳細なサービス提案',
    expectedEffects: '期待される効果',
    implementationSteps: '導入ステップ',
    supportSystem: 'サポート体制',
    riskManagement: 'リスク管理',
    investmentReturn: '投資対効果',
  });

  const trimmed = raw.trim();
  // ```json ... ``` で囲まれている場合に備えてコードフェンスを剥がす
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  try {
    const parsed = JSON.parse(unfenced);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { ...fallback(''), ...parsed } as ProposalContent;
    }
  } catch {
    /* JSON でなければ本文としてそのまま扱う */
  }
  return fallback(trimmed);
};

export interface GenerateResult {
  success: boolean;
  content?: string;
  error?: string;
}

/** 生テキストを取得する（チャット用） */
export const generateText = async (
  prompt: string,
  userInfo: Record<string, string> = {},
): Promise<GenerateResult> => {
  try {
    const { data } = await openaiAPI.generate({ prompt, userInfo });
    return { success: true, content: data.content };
  } catch (error) {
    const result = toApiResult(error);
    return { success: false, error: result.error };
  }
};

/** 提案資料を取得する（資料生成用・要ログイン） */
export const generateProposal = async (
  info: Record<string, unknown>,
): Promise<{ success: boolean; content?: ProposalContent; error?: string }> => {
  const userInfo = sanitizeUserInfo(info);
  const result = await generateText(buildProposalPrompt(userInfo), userInfo);

  if (!result.success || !result.content) {
    return { success: false, error: result.error };
  }
  return { success: true, content: parseProposal(result.content) };
};

export interface DocumentResult {
  success: boolean;
  /** 節キー → 本文。メールで送られたものと同一 */
  content?: Record<string, string>;
  reference?: string;
  /** 入力されたメールアドレスへ送信できたか */
  emailSent?: boolean;
  /** 画面に出す案内文（サーバーが生成） */
  message?: string;
  error?: string;
}

/**
 * 資料ダウンロードフォームから資料を請求する（未ログインで利用可）。
 *
 * 生成とメール送信はサーバー側で行われるため、ここではプロンプトを組み立てない。
 * 戻り値の content は、実際に送られたメールと同じ内容。
 */
export const requestDocument = async (
  payload: DocumentRequestPayload,
): Promise<DocumentResult> => {
  try {
    const { data } = await documentAPI.request(payload);
    return {
      success: true,
      content: data.content,
      reference: data.reference,
      emailSent: data.email_sent,
      message: data.message,
    };
  } catch (error) {
    const result = toApiResult(error);
    return { success: false, error: result.error };
  }
};
