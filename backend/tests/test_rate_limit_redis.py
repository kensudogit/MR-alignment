"""Redis 共有のレート制限。

プロセス内メモリのままだと、ECS のタスクを2つに増やした瞬間に
実効上限が2倍になる。面談予約のように枠を押さえる操作では、
これは「枠の枯渇」に直結するため、共有ストアの挙動を固定しておく。

実際の Redis は立てず、Lua スクリプトの戻り値を模したクライアントで
呼び出し方と解釈を確認する。
"""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.rate_limit import Rate, RedisSlidingWindowLimiter, SlidingWindowLimiter


class FakeRedis:
    """eval の戻り値を差し替えられるだけのクライアント。"""

    def __init__(self, results: list[list[int]] | None = None, error: Exception | None = None):
        self.results = results or []
        self.error = error
        self.calls: list[tuple] = []

    async def eval(self, script: str, numkeys: int, *args: object) -> list[int]:
        self.calls.append((script, numkeys, *args))
        if self.error is not None:
            raise self.error
        return self.results.pop(0) if self.results else [1, 0]


RATE = Rate(limit=5, window_seconds=60)


async def test_許可されると残り回数を返す() -> None:
    limiter = RedisSlidingWindowLimiter(FakeRedis([[1, 3]]))

    assert await limiter.check("contact:1.2.3.4", RATE) == 3


async def test_上限に達すると429を返す() -> None:
    """2つ目の戻り値は最も古い記録の時刻。そこから Retry-After を計算する。"""
    import time

    oldest_ms = int(time.time() * 1000) - 10_000  # 10秒前
    limiter = RedisSlidingWindowLimiter(FakeRedis([[0, oldest_ms]]))

    with pytest.raises(HTTPException) as exc:
        await limiter.check("contact:1.2.3.4", RATE)

    assert exc.value.status_code == 429
    # 60秒窓の10秒経過 → あと50秒ほど
    retry_after = int(exc.value.headers["Retry-After"])
    assert 45 <= retry_after <= 55


async def test_キーには接頭辞が付く() -> None:
    """他の用途のキーと混ざらないようにする。"""
    redis = FakeRedis()
    limiter = RedisSlidingWindowLimiter(redis)

    await limiter.check("appointments:create:1.2.3.4", RATE)

    _script, numkeys, key, _now, window, limit, _member = redis.calls[0]
    assert numkeys == 1
    assert key == "ratelimit:appointments:create:1.2.3.4"
    assert window == 60_000  # ミリ秒で渡す
    assert limit == 5


async def test_Redis障害時はプロセス内メモリへ落ちる() -> None:
    """制限を完全に外す（素通しにする）より、緩くても効いているほうが安全。"""
    fallback = SlidingWindowLimiter()
    limiter = RedisSlidingWindowLimiter(
        FakeRedis(error=ConnectionError("redis down")), fallback=fallback
    )

    rate = Rate(limit=2, window_seconds=60)
    assert await limiter.check("k", rate) == 1
    assert await limiter.check("k", rate) == 0

    with pytest.raises(HTTPException) as exc:
        await limiter.check("k", rate)
    assert exc.value.status_code == 429


async def test_Redisが復旧したら共有ストアに戻る() -> None:
    redis = FakeRedis(error=ConnectionError("down"))
    limiter = RedisSlidingWindowLimiter(redis)

    await limiter.check("k", RATE)  # ここは失敗してフォールバック
    assert limiter._degraded is True

    redis.error = None
    redis.results = [[1, 4]]
    assert await limiter.check("k", RATE) == 4
    assert limiter._degraded is False
