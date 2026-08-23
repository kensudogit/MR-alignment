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

# 改行コードを LF に揃えてから実行権限を付ける。
#
# Windows の作業ツリーではこの .sh が CRLF になっていることがある
# （.gitattributes で eol=lf を宣言していても、core.autocrlf=true で
#  チェックアウト済みのファイルはそのまま CRLF で残る）。
# GitHub 連携のビルドでは LF で取得されるため表面化しないが、
# `railway up` のようにローカルの作業ツリーをそのまま送る経路では CRLF が届く。
#
# その状態だとシェバンが「bash + CR」という名前のコマンドとして解釈され、
#   env: 'bash\r': No such file or directory
# だけを残してコンテナが起動しない。ビルドは成功するのでログを見ないと分からない。
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

USER appuser

# Railway は PORT を注入する
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/health" || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
