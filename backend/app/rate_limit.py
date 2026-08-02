"""レート制限。

Laravel の throttle ミドルウェア相当を、外部依存なしで実装する。

【重要な制約】
  これはプロセス内メモリのカウンタである。ワーカーを複数起動したり
  インスタンスを水平スケールすると、上限が「ワーカー数 × 設定値」に緩む。
  本番で厳密に効かせたい場合は Redis 等の共有ストアに置き換えること。
  それでも、無制限より遥かに安全なため既定で有効にしている。
"""
from __future__ import annotations

import asyncio
import re
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import HTTPException, Request, status

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
    def parse(cls, spec: str) -> "Rate":
        """'5/minute' のような文字列を解釈する。"""
        match = _SPEC.match(spec)
        if not match:
            raise ValueError(f"レート制限の指定が不正です: {spec!r}（例: '5/minute'）")
        return cls(limit=int(match.group(1)), window_seconds=_UNITS[match.group(2).lower()])


class SlidingWindowLimiter:
    """スライディングウィンドウ方式のカウンタ。

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
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="リクエストが多すぎます。しばらく時間をおいて再度お試しください。",
                    headers={"Retry-After": str(max(retry_after, 1))},
                )

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


limiter = SlidingWindowLimiter()


def rate_limit(spec: str, scope: str):
    """レート制限の依存性を作る。

    Args:
        spec: '5/minute' のような指定
        scope: エンドポイントを識別する名前（キーの衝突を防ぐ）
    """
    rate = Rate.parse(spec)

    async def dependency(request: Request) -> None:
        from app.dependencies import client_ip

        key = f"{scope}:{client_ip(request)}"
        remaining = await limiter.check(key, rate)
        # レスポンスヘッダは routers 側で付けないため、
        # 必要ならここで request.state に載せて middleware から出力する
        request.state.rate_limit_remaining = remaining

    return dependency
