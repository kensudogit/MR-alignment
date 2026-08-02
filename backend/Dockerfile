# syntax=docker/dockerfile:1
#
# MR-alignment バックエンド（FastAPI + PostgreSQL）
# マルチステージビルドで、実行イメージにビルドツールを残さない。

# --------------------------------------------------------------- ビルド
FROM python:3.11-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# asyncpg / bcrypt のビルドに必要
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# 依存だけ先に入れてレイヤキャッシュを効かせる
COPY pyproject.toml ./
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip && pip install .

# --------------------------------------------------------------- 実行
FROM python:3.11-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# libpq のランタイムのみ（開発ヘッダは含めない）
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# root で動かさない
RUN useradd --create-home --uid 1000 appuser

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser migrations ./migrations
COPY --chown=appuser:appuser alembic.ini pyproject.toml ./
COPY --chown=appuser:appuser docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER appuser

# Railway は PORT を注入する
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/health" || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
