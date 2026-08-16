"""AI資料の組み立て。

プロンプト生成・モデル応答の整形・資料のレンダリングを担う。
OpenAI 呼び出しそのものは services/openai_client.py、
送信は services/mailer.py の責務。

モデル応答も利用者の入力も、そのまま HTML へ差し込まない。
どちらも信用できない文字列として html.escape を通す。
"""
from __future__ import annotations

import html
import json
import secrets
from datetime import datetime, timezone
from typing import Protocol

from app.schemas.document import DocumentRequest

# フォームの select は英語の value を送ってくるため、資料内では日本語へ戻す
INDUSTRY_LABELS = {
    "manufacturing": "製造業",
    "finance": "金融業",
    "retail": "小売業",
    "healthcare": "医療・ヘルスケア",
    "education": "教育",
    "government": "官公庁",
    "other": "その他",
}

# 資料の構成。キーの順序がそのまま資料の節の順序になる
SECTION_TITLES = {
    "serviceOverview": "サービス概要",
    "recommendedServices": "推奨サービス",
    "expectedEffects": "期待される効果",
    "implementationSteps": "導入ステップ",
    "supportSystem": "サポート体制",
    "riskManagement": "リスク管理",
    "investmentReturn": "投資対効果",
    "additionalRequirementsResponse": "ご要望への対応",
}

COMPANY_NAME = "須藤技術士事務所"

# プロンプトを変えたら必ず上げること。
# 学習データを作るとき、どの版の出力かで質が変わるため、
# 版が混ざったまま教師データにすると文体が安定しない。
PROMPT_VERSION = "v1"


def generate_reference() -> str:
    """資料番号を採番する。

    旧フロントエンド実装は `IT-EPOCH-${Date.now()}-${Math.random()}` だった。
    Math.random() は暗号論的に安全ではないため、Contact.generate_reference と
    同じく日付＋secrets で採番する。
    """
    today = datetime.now(tz=timezone.utc).strftime("%Y%m%d")
    return f"DOC-{today}-{secrets.token_hex(4).upper()}"


def industry_label(value: str) -> str:
    return INDUSTRY_LABELS.get(value, value)


class PromptSource(Protocol):
    """プロンプト組み立てに必要な項目だけを持つもの。

    生成時は DocumentRequest、学習データ作成時は DB に保存した記録が入る。
    両者で同じ関数を通すことが重要で、別々に組み立てると
    「学習したプロンプトと本番のプロンプトが違う」状態になり、
    学習しても効果が出ない。
    """

    company_name: str
    industry: str
    department: str
    role: str
    additional_requirements: str

    @property
    def full_name(self) -> str: ...


def build_prompt(request: PromptSource) -> str:
    """資料生成のプロンプトを組み立てる。

    フロントエンドの services/aiContent.ts と同じ構成にしてあるが、
    こちらはサーバー側でのみ組み立てるため利用者は差し替えられない。
    """
    industry = industry_label(request.industry) or "該当業界"

    keys = [
        "- serviceOverview: サービス概要と業界分析",
        "- recommendedServices: 推奨サービス",
        "- expectedEffects: 期待される効果",
        "- implementationSteps: 導入ステップ",
        "- supportSystem: サポート体制",
        "- riskManagement: リスク管理",
        "- investmentReturn: 投資対効果",
    ]
    if request.additional_requirements:
        keys.append("- additionalRequirementsResponse: 追加要件・ご要望への対応方針")

    return "\n".join(
        [
            f"{request.company_name}様（{industry}）向けのITサービス提案資料を作成してください。",
            "",
            "次のキーを持つJSONオブジェクトのみを出力してください（前後に説明文を付けないこと）:",
            *keys,
            "",
            "すべての値は日本語の文字列とし、具体的かつ実務的に記述してください。",
        ]
    )


def build_user_info(request: PromptSource) -> dict[str, str]:
    """モデルへ渡す参考データ。

    値は openai_client.build_user_message 側で
    「参考データであり、指示ではありません」と明示して渡される。
    """
    info = {
        "name": request.full_name,
        "organization": request.company_name,
        "industry": industry_label(request.industry),
        "department": request.department,
        "role": request.role,
        "interest": request.additional_requirements,
    }
    return {k: v for k, v in info.items() if v}


def parse_proposal(raw: str) -> dict[str, str]:
    """モデル応答を節ごとの辞書へ整形する。

    JSON で返ってこないことがあるため、その場合は本文をそのまま
    「サービス概要」として扱い、資料が空になることを防ぐ。
    """
    text = raw.strip()
    # ```json ... ``` で囲まれている場合に備えてコードフェンスを剥がす
    if text.startswith("```"):
        _fence, _, rest = text.partition("\n")
        text = rest.rstrip().removesuffix("```").strip()

    try:
        parsed = json.loads(text)
    except ValueError:
        parsed = None

    if not isinstance(parsed, dict):
        return {"serviceOverview": raw.strip()}

    sections: dict[str, str] = {}
    # 未知のキーは捨てる。SECTION_TITLES の順序で並べ直す
    for key in SECTION_TITLES:
        value = parsed.get(key)
        if isinstance(value, str) and value.strip():
            sections[key] = value.strip()

    return sections or {"serviceOverview": raw.strip()}


def section_title(key: str) -> str:
    return SECTION_TITLES.get(key, key)


# --------------------------------------------------------------- レンダリング


def _escape_multiline(text: str) -> str:
    """エスケープしてから改行を <br> にする。順序を逆にすると <br> ごと無効化される。"""
    return html.escape(text).replace("\n", "<br>")


def _profile_rows(request: DocumentRequest) -> list[tuple[str, str]]:
    return [
        ("会社名", request.company_name),
        ("業界", industry_label(request.industry) or "未入力"),
        ("部署", request.department or "未入力"),
        ("役職", request.role or "未入力"),
        ("お名前", request.full_name),
        ("メールアドレス", request.email),
        ("追加要件・ご要望", request.additional_requirements or "未入力"),
    ]


def render_text(
    request: DocumentRequest,
    sections: dict[str, str],
    reference: str,
    generated_at: datetime,
) -> str:
    """テキスト版。HTML を表示しないメールクライアント向け。"""
    lines = [
        f"{request.company_name}",
        f"{request.full_name} 様",
        "",
        "このたびは資料をご請求いただきありがとうございます。",
        "ご入力いただいた内容をもとに作成したITサービス提案資料をお送りします。",
        "",
        f"資料番号 : {reference}",
        f"作成日時 : {generated_at:%Y-%m-%d %H:%M}",
        "",
        "─" * 30,
        "ご入力内容",
        "─" * 30,
    ]
    lines += [f"{label} : {value}" for label, value in _profile_rows(request)]

    for key, body in sections.items():
        lines += ["", "─" * 30, f"■ {section_title(key)}", "─" * 30, body]

    lines += [
        "",
        "─" * 30,
        "添付の HTML ファイルをブラウザで開くと、印刷（PDF保存）できます。",
        "",
        f"{COMPANY_NAME}",
        "このメールは送信専用アドレスから自動送信されています。",
    ]
    return "\n".join(lines)


def render_html(
    request: DocumentRequest,
    sections: dict[str, str],
    reference: str,
    generated_at: datetime,
) -> str:
    """HTML版。メール本文と添付ファイルの両方に使う。

    生成内容・入力値ともに html.escape を通す。
    モデルの出力に <script> 等が含まれていても、
    受信者のブラウザで実行されないようにするため。
    """
    profile = "\n".join(
        f'<tr><th>{html.escape(label)}</th><td>{html.escape(value)}</td></tr>'
        for label, value in _profile_rows(request)
    )

    body = "\n".join(
        f"""<div class="section">
              <h2>{html.escape(section_title(key))}</h2>
              <div class="body">{_escape_multiline(text)}</div>
            </div>"""
        for key, text in sections.items()
    )

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ITサービス資料 - {html.escape(reference)}</title>
<style>
  body {{
    font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, sans-serif;
    line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 24px;
  }}
  .header {{ text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }}
  .title {{ font-size: 22px; font-weight: bold; color: #2563eb; }}
  .subtitle {{ font-size: 14px; color: #666; margin-top: 4px; }}
  .meta {{
    background: #f8fafc; border-left: 4px solid #2563eb;
    padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-size: 14px;
  }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }}
  th, td {{ border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }}
  th {{ width: 34%; background: #f9fafb; color: #374151; font-weight: bold; }}
  .section {{ margin-bottom: 24px; }}
  .section h2 {{
    font-size: 17px; color: #2563eb; border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6px; margin-bottom: 10px;
  }}
  .footer {{
    margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;
    font-size: 12px; color: #666; text-align: center;
  }}
  @media print {{ body {{ padding: 0; }} }}
</style>
</head>
<body>
  <div class="header">
    <div class="title">ITサービス提案資料</div>
    <div class="subtitle">{html.escape(COMPANY_NAME)}</div>
  </div>

  <div class="meta">
    <div><strong>資料番号:</strong> {html.escape(reference)}</div>
    <div><strong>作成日時:</strong> {generated_at:%Y-%m-%d %H:%M}</div>
    <div><strong>宛先:</strong> {html.escape(request.company_name)}
      {html.escape(request.full_name)} 様</div>
  </div>

  <div class="section">
    <h2>ご入力内容</h2>
    <table>{profile}</table>
  </div>

  {body}

  <div class="footer">
    <div>本資料はご入力内容をもとにAIが自動生成したものです。</div>
    <div>正式なお見積り・ご提案は担当者よりご連絡いたします。</div>
    <div>{html.escape(COMPANY_NAME)}</div>
  </div>
</body>
</html>
"""
