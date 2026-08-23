"""クライアント IP の決定。

X-Forwarded-For の **先頭** を信じると、ヘッダを自分で付けるだけで
別人になりすませる。IP単位のレート制限（面談予約は 5/hour）が
リクエストごとに素通りし、監査用に残す IP も嘘になる。

前段のプロキシが書いた分だけを信じる、という規則をここで固定する。
"""
from __future__ import annotations

import pytest
from starlette.requests import Request

from app import dependencies
from app.dependencies import client_ip

SOCKET_IP = "10.0.0.9"  # ALB など、直接つながってくる相手


def make_request(forwarded: str | None) -> Request:
    headers = [(b"host", b"example.com")]
    if forwarded is not None:
        headers.append((b"x-forwarded-for", forwarded.encode()))

    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": headers,
            "client": (SOCKET_IP, 51234),
        }
    )


@pytest.fixture
def hops(monkeypatch: pytest.MonkeyPatch):
    """信頼するプロキシの段数を差し替える。"""

    def _set(value: int) -> None:
        monkeypatch.setattr(dependencies.settings, "trusted_proxy_hops", value)

    return _set


def test_ALB1段では末尾が本当のクライアント(hops) -> None:
    """ALB は「受け取った XFF に接続元を追記」する。末尾が ALB の見た相手。"""
    hops(1)
    assert client_ip(make_request("203.0.113.5")) == "203.0.113.5"


def test_先頭を詐称されても無視する(hops) -> None:
    """攻撃者が XFF: 1.2.3.4 を付けて送ってきた場合。

        送信時   : X-Forwarded-For: 1.2.3.4
        ALB通過後: X-Forwarded-For: 1.2.3.4, <攻撃者の実IP>

    ここで先頭を採ると、攻撃者は毎回違う値を名乗るだけで
    IP単位のレート制限を無限に回避できる。
    """
    hops(1)
    assert client_ip(make_request("1.2.3.4, 203.0.113.5")) == "203.0.113.5"


def test_複数回詐称されても無視する(hops) -> None:
    hops(1)
    request = make_request("1.2.3.4, 5.6.7.8, 9.10.11.12, 203.0.113.5")
    assert client_ip(request) == "203.0.113.5"


def test_CloudFrontとALBの2段構成(hops) -> None:
    """CloudFront が閲覧者IPを書き、ALB が CloudFront のIPを追記する。"""
    hops(2)
    request = make_request("1.2.3.4, 203.0.113.5, 130.176.0.1")
    assert client_ip(request) == "203.0.113.5"


def test_プロキシ無しならヘッダを一切信用しない(hops) -> None:
    hops(0)
    assert client_ip(make_request("203.0.113.5")) == SOCKET_IP


def test_ヘッダが無ければ接続元を使う(hops) -> None:
    hops(1)
    assert client_ip(make_request(None)) == SOCKET_IP


def test_空のヘッダは無視する(hops) -> None:
    hops(1)
    assert client_ip(make_request("   ")) == SOCKET_IP


def test_段数より要素が少なければ末尾を使う(hops) -> None:
    """構成と設定が食い違っている状態。詐称されうる左端へは絶対に倒さない。"""
    hops(3)
    assert client_ip(make_request("1.2.3.4, 203.0.113.5")) == "203.0.113.5"


def test_空白は取り除く(hops) -> None:
    hops(1)
    assert client_ip(make_request("1.2.3.4 ,  203.0.113.5  ")) == "203.0.113.5"


# --------------------------------------------------------------- 設定ミスの検知


@pytest.fixture(autouse=True)
def _reset_warning():
    """警告は1プロセスで1回だけ出るため、テストごとに戻す。"""
    dependencies._proxy_hops_warned = False
    yield
    dependencies._proxy_hops_warned = False


def test_段数が実構成と合わないと警告する(hops, caplog) -> None:
    """全リクエストが同じ内部アドレスに潰れる状態を、黙って進ませない。

    この状態でも 200 は返るため、警告が無いと
    「IP 単位のはずのレート制限が、全利用者で1つの枠を奪い合う」ことに
    誰も気づけない。
    """
    hops(1)
    # 前段が2段ある構成なのに hops=1 にしている状態
    with caplog.at_level("WARNING"):
        resolved = client_ip(make_request("203.0.113.5, 10.0.0.7"))

    assert resolved == "10.0.0.7"
    assert "TRUSTED_PROXY_HOPS" in caplog.text


def test_正しい構成では警告しない(hops, caplog) -> None:
    hops(1)
    with caplog.at_level("WARNING"):
        client_ip(make_request("8.8.8.8"))

    assert caplog.text == ""


def test_警告は1回だけ(hops, caplog) -> None:
    """毎リクエスト出しても新しい情報は無く、ログ料金だけが増える。"""
    hops(1)
    with caplog.at_level("WARNING"):
        for _ in range(5):
            client_ip(make_request("203.0.113.5, 10.0.0.7"))

    assert caplog.text.count("TRUSTED_PROXY_HOPS") == 1


def test_既定はヘッダを信用しない() -> None:
    """設定漏れは「厳しすぎる側」へ倒す。

    多すぎる側に間違えると、全員が同じ IP に見えてレート制限を共有する
    （不便だが、外部から破ることはできない）。
    少なすぎる側に間違えると、ヘッダを付け替えるだけで制限を回避できる。
    後者は攻撃者に主導権を渡すため、既定は 0 にしてある。
    """
    from app.config import Settings

    # 環境変数（conftest が 1 を設定している）ではなく、宣言された既定値を見る
    assert Settings.model_fields["trusted_proxy_hops"].default == 0
