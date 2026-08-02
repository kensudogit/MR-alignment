#!/usr/bin/env bash
#
# バックエンド起動スクリプト。
#
# 旧 Laravel 版はマイグレーション失敗を `|| echo "..."` で握り潰していたため、
# スキーマ不整合のままコンテナが起動していた。ここでは失敗したら起動を中止する。
set -euo pipefail

echo "=== MR-alignment backend (FastAPI) 起動 ==="

PORT="${PORT:-8000}"
APP_ENV="${APP_ENV:-local}"

# --------------------------------------------------------- 設定の検証
echo "[1/3] 設定を検証しています..."

# config.py 側のバリデータ（本番で APP_DEBUG=true や JWT_SECRET_KEY 未設定を弾く）を
# 起動前に実行しておく。ここで落とせば、不正な設定のまま待ち受けを始めずに済む。
python -c "from app.config import get_settings; get_settings()"

if [ "${APP_ENV}" = "production" ]; then
    [ -n "${OPENAI_API_KEY:-}" ] || \
        echo "警告: OPENAI_API_KEY が未設定です。AI資料生成は 503 を返します。" >&2
    [ -n "${CONTACT_MAIL_TO:-}" ] || \
        echo "警告: CONTACT_MAIL_TO が未設定です。問い合わせ通知メールは送信されません。" >&2
fi

# --------------------------------------------------------- DB 接続待ち
echo "[2/3] データベースへの接続を確認しています..."

python - <<'PY'
import asyncio
import sys

from sqlalchemy import text

from app.database import engine


async def wait_for_db(attempts: int = 30, delay: float = 2.0) -> None:
    for attempt in range(1, attempts + 1):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            print(f"      データベースに接続しました（{attempt}回目）")
            return
        except Exception as exc:  # noqa: BLE001
            if attempt == attempts:
                print(f"エラー: データベースに接続できませんでした: {exc}", file=sys.stderr)
                sys.exit(1)
            await asyncio.sleep(delay)


asyncio.run(wait_for_db())
PY

# --------------------------------------------------------- マイグレーション
echo "[3/3] マイグレーションを適用しています..."
# 失敗したら起動を中止する。握り潰すとスキーマ不整合に気づけない。
alembic upgrade head

# --------------------------------------------------------- 起動
if [ "${APP_ENV}" = "production" ]; then
    WORKERS="${WEB_CONCURRENCY:-2}"
    echo "=== ポート ${PORT} で起動します（workers=${WORKERS}）==="
    # 注意: レート制限はプロセス内メモリのため、workers を増やすと
    # 実効上限が「workers 数 × 設定値」に緩む。厳密に効かせたい場合は
    # Redis 等の共有ストアへ置き換えること。
    exec uvicorn app.main:app \
        --host 0.0.0.0 \
        --port "${PORT}" \
        --workers "${WORKERS}" \
        --proxy-headers \
        --forwarded-allow-ips='*' \
        --no-server-header
else
    echo "=== ポート ${PORT} で起動します（開発モード / 自動リロード）==="
    exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --reload
fi
