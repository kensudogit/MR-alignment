"""レート制限。

Laravel の throttle ミドルウェア相当を、方式を選べる形で実装する。

  - `SlidingWindowLimiter`      … プロセス内メモリ。開発・単一プロセス向け
  - `RedisSlidingWindowLimiter` … Redis 共有。複数プロセス／複数タスク向け

【なぜ共有ストアが要るか】
  プロセス内メモリのカウンタは、ワーカーやタスクを増やすと
  実効上限が「タスク数 × ワーカー数 × 設定値」まで緩む。
  ECS で2タスク×2ワーカーなら、5/hour のつもりが 20/hour になる。
  面談予約のように「枠を押さえる」操作では、これは枠の枯渇に直結する。

Redis に繋がらない場合はプロセス内メモリへ落とす。
制限を完全に外す（fail open）より、緩くても効いているほうが安全なため。
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
import uuid
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Protocol

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

_UNITS = {
    "second": 1,
    "minute": 60,
    "hour": 3600,
    "day": 86400,
}

_SPEC = re.compile(r"^\s*(\d+)\s*/\s*(second|minute|hour|day)s?\s*$", re.IGNORECASE)


@dataclass(frozen=True)
class Rate:
    limit: int
    window_seconds: int

    @classmethod
    def parse(cls, spec: str) -> Rate:
        """'5/minute' のような文字列を解釈する。"""
        match = _SPEC.match(spec)
        if not match:
            raise ValueError(f"レート制限の指定が不正です: {spec!r}（例: '5/minute'）")
        return cls(limit=int(match.group(1)), window_seconds=_UNITS[match.group(2).lower()])


def _too_many_requests(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="リクエストが多すぎます。しばらく時間をおいて再度お試しください。",
        headers={"Retry-After": str(max(retry_after, 1))},
    )


class Limiter(Protocol):
    """1回分を記録し、残り回数を返す。超過時は 429 を送出する。"""

    async def check(self, key: str, rate: Rate) -> int: ...


class SlidingWindowLimiter:
    """スライディングウィンドウ方式のカウンタ（プロセス内メモリ）。

    固定ウィンドウだと境界をまたいで 2 倍の要求が通ってしまうため、
    直近 N 秒のタイムスタンプを保持する方式にしている。
    """

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._last_cleanup = time.monotonic()

    async def check(self, key: str, rate: Rate) -> int:
        """1 回分を記録し、残り回数を返す。超過時は例外を送出する。"""
        async with self._locks[key]:
            now = time.monotonic()
            window_start = now - rate.window_seconds
            hits = self._hits[key]

            while hits and hits[0] < window_start:
                hits.popleft()

            if len(hits) >= rate.limit:
                retry_after = int(hits[0] + rate.window_seconds - now) + 1
                raise _too_many_requests(retry_after)

            hits.append(now)
            self._maybe_cleanup(now)
            return rate.limit - len(hits)

    def _maybe_cleanup(self, now: float) -> None:
        """空になったキーを回収し、メモリの無制限な増加を防ぐ。"""
        if now - self._last_cleanup < 300:
            return
        self._last_cleanup = now
        empty = [k for k, v in self._hits.items() if not v]
        for k in empty:
            self._hits.pop(k, None)
            self._locks.pop(k, None)

    def reset(self) -> None:
        """テスト用。"""
        self._hits.clear()
        self._locks.clear()


# ZSET によるスライディングウィンドウ。
# 「掃除 → 数える → 追加」を1往復のアトミックな操作にまとめる。
# 3コマンドに分けると、その隙間に別タスクの要求が入り上限を超える。
_REDIS_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return {0, tonumber(oldest[2]) or now}
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return {1, limit - count - 1}
"""


class RedisSlidingWindowLimiter:
    """Redis 共有のスライディングウィンドウ。

    複数プロセス・複数タスクで同じ上限を共有する。
    Redis が落ちている間はプロセス内メモリへ落として動き続ける
    （制限を外すより、緩くても効いているほうが安全）。
    """

    def __init__(self, client: object, fallback: SlidingWindowLimiter | None = None) -> None:
        self._client = client
        self._fallback = fallback or SlidingWindowLimiter()
        self._degraded = False

    async def check(self, key: str, rate: Rate) -> int:
        now_ms = int(time.time() * 1000)
        window_ms = rate.window_seconds * 1000

        try:
            allowed, extra = await self._client.eval(  # type: ignore[attr-defined]
                _REDIS_SCRIPT,
                1,
                f"ratelimit:{key}",
                now_ms,
                window_ms,
                rate.limit,
                uuid.uuid4().hex,
            )
        except Exception as exc:  # noqa: BLE001 - Redis 障害で受付を止めない
            if not self._degraded:
                # 復旧するまで毎リクエスト出しても意味がないので、最初の1回だけ
                logger.error(
                    "Redis に接続できないため、レート制限をプロセス内メモリへ切り替えます: %s",
                    exc,
                )
                self._degraded = True
            return await self._fallback.check(key, rate)

        if self._degraded:
            logger.info("Redis が復旧したため、共有のレート制限に戻します")
            self._degraded = False

        if int(allowed) == 0:
            retry_after = int((int(extra) + window_ms - now_ms) / 1000) + 1
            raise _too_many_requests(retry_after)

        return int(extra)


# 既定はプロセス内メモリ。REDIS_URL があれば起動時に差し替える（app/main.py）
limiter: Limiter = SlidingWindowLimiter()


def set_limiter(new_limiter: Limiter) -> None:
    """使用するカウンタを差し替える。起動時とテストから呼ぶ。"""
    global limiter
    limiter = new_limiter


def rate_limit(spec: str, scope: str) -> Callable[[Request], Awaitable[None]]:
    """レート制限の依存性を作る。

    Args:
        spec: '5/minute' のような指定
        scope: エンドポイントを識別する名前（キーの衝突を防ぐ）
    """
    rate = Rate.parse(spec)

    async def dependency(request: Request) -> None:
        from app.dependencies import client_ip

        key = f"{scope}:{client_ip(request)}"
        # limiter はモジュール変数として引く（起動時に差し替わるため）
        remaining = await limiter.check(key, rate)
        # レスポンスヘッダは routers 側で付けないため、
        # 必要ならここで request.state に載せて middleware から出力する
        request.state.rate_limit_remaining = remaining

    return dependency
