"""AI資料の記録（保存・手直し・集計）。

学習データの供給源になるため、ここが壊れると後から取り返せない。
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

from httpx import AsyncClient
from sqlalchemy.exc import OperationalError

from tests.conftest import auth_headers
from tests.test_documents import AI_RESPONSE, PAYLOAD


def _patch_generate() -> AsyncMock:
    return AsyncMock(return_value=AI_RESPONSE)


async def _generate(client: AsyncClient) -> str:
    with patch("app.routers.documents.generate_content", new=_patch_generate()), patch(
        "app.routers.documents.send_document_mail", new=AsyncMock(return_value=True)
    ):
        response = await client.post("/api/documents", json=PAYLOAD)
    assert response.status_code == 200, response.text
    return response.json()["reference"]


# --------------------------------------------------------------- 保存


async def test_生成した資料が保存される(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)

    response = await client.get(f"/api/documents/records/{reference}", headers=headers)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["reference"] == reference
    assert body["company_name"] == "株式会社テスト"
    assert body["status"] == "generated"
    assert body["generated_sections"]["serviceOverview"] == "サービス概要の本文"
    # 手直し前は生成物がそのまま最新
    assert body["current_sections"] == body["generated_sections"]
    assert body["revisions"] == []


async def test_業界は日本語ラベルで保存される(client: AsyncClient) -> None:
    """英語コードのまま保存すると、集計のたびに変換表が要る。"""
    headers = await auth_headers(client)
    reference = await _generate(client)

    response = await client.get(f"/api/documents/records/{reference}", headers=headers)

    assert response.json()["industry"] == "製造業"


async def test_生成条件が記録される(client: AsyncClient) -> None:
    """どのモデル・どの版のプロンプトで作ったかが無いと、
    後から教師データを選別できない。
    """
    headers = await auth_headers(client)
    reference = await _generate(client)

    body = (await client.get(f"/api/documents/records/{reference}", headers=headers)).json()

    assert body["model"]
    assert body["prompt_version"] == "v1"


async def test_保存に失敗しても資料の送付は成立する(client: AsyncClient) -> None:
    """記録は重要だが、目の前の利用者への価値提供を止めてまで優先しない。"""
    with patch("app.routers.documents.generate_content", new=_patch_generate()), patch(
        "app.routers.documents.send_document_mail", new=AsyncMock(return_value=True)
    ), patch(
        "app.services.document_store.DocumentStore.create",
        new=AsyncMock(side_effect=OperationalError("stmt", {}, Exception("DB down"))),
    ):
        response = await client.post("/api/documents", json=PAYLOAD)

    assert response.status_code == 200
    assert response.json()["email_sent"] is True


# --------------------------------------------------------------- 認証


async def test_記録の閲覧は認証必須(client: AsyncClient) -> None:
    reference = await _generate(client)

    for path in ("/api/documents/records", f"/api/documents/records/{reference}"):
        assert (await client.get(path)).status_code == 401


async def test_手直しの登録は認証必須(client: AsyncClient) -> None:
    reference = await _generate(client)

    response = await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"serviceOverview": "直した本文"}},
    )

    assert response.status_code == 401


# --------------------------------------------------------------- 手直し


async def test_手直しを登録できる(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)

    response = await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={
            "sections": {
                "serviceOverview": "人が直した本文",
                # こちらは元と同じ内容。変更として数えられないことを確認する
                "recommendedServices": "推奨サービスの本文",
            },
            "note": "業界の記述が一般論すぎたため具体化",
        },
        headers=headers,
    )

    assert response.status_code == 201, response.text
    body = response.json()
    # 2節送ったうち、実際に変わったのは1節だけ
    assert body["changed_section_count"] == 1
    assert body["note"].startswith("業界の記述")
    # 送らなかった節は直前の内容が引き継がれる（部分更新）
    assert body["sections"]["expectedEffects"] == "期待される効果の本文"
    assert len(body["sections"]) == 8


async def test_手直しすると確認済みになる(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)

    await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"serviceOverview": "直した本文"}},
        headers=headers,
    )

    body = (await client.get(f"/api/documents/records/{reference}", headers=headers)).json()
    assert body["status"] == "reviewed"
    # 生成物は保持されたまま、最新だけが差し替わる
    assert body["generated_sections"]["serviceOverview"] == "サービス概要の本文"
    assert body["current_sections"]["serviceOverview"] == "直した本文"


async def test_生成物に無い節は拒否される(client: AsyncClient) -> None:
    """勝手な節を足せると学習データの構造が崩れる。"""
    headers = await auth_headers(client)
    reference = await _generate(client)

    response = await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"unknownSection": "勝手な節"}},
        headers=headers,
    )

    assert response.status_code == 422


async def test_手直しは何度でも積める(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)

    for text in ("1回目", "2回目"):
        await client.post(
            f"/api/documents/records/{reference}/revisions",
            json={"sections": {"serviceOverview": text}},
            headers=headers,
        )

    body = (await client.get(f"/api/documents/records/{reference}", headers=headers)).json()
    assert len(body["revisions"]) == 2
    assert body["current_sections"]["serviceOverview"] == "2回目"


# --------------------------------------------------------------- 集計


async def test_学習に使える件数は人の手が入ったものだけ(client: AsyncClient) -> None:
    """生成したままのものを教師データにすると、
    AIの出力でAIを学習させることになり癖が増幅される。
    """
    headers = await auth_headers(client)
    await _generate(client)  # 手直しなし
    reference = await _generate(client)

    stats = (await client.get("/api/documents/records/stats", headers=headers)).json()
    assert stats["total"] == 2
    assert stats["trainable"] == 0
    assert stats["ready"] is False

    await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"serviceOverview": "直した本文"}},
        headers=headers,
    )

    stats = (await client.get("/api/documents/records/stats", headers=headers)).json()
    assert stats["trainable"] == 1
    # 閾値に届いていないので、まだ学習してはいけない
    assert stats["ready"] is False
    assert stats["minimum_recommended"] == 100


async def test_却下したものは学習対象にならない(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)
    await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"serviceOverview": "直した本文"}},
        headers=headers,
    )
    await client.patch(
        f"/api/documents/records/{reference}/status",
        json={"status": "rejected"},
        headers=headers,
    )

    stats = (await client.get("/api/documents/records/stats", headers=headers)).json()
    assert stats["trainable"] == 0


async def test_一覧を状態で絞り込める(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    await _generate(client)
    reference = await _generate(client)
    await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"serviceOverview": "直した本文"}},
        headers=headers,
    )

    listing = (
        await client.get("/api/documents/records?status=reviewed", headers=headers)
    ).json()

    assert listing["total"] == 1
    assert listing["items"][0]["reference"] == reference
    assert listing["items"][0]["revision_count"] == 1


async def test_存在しない資料は404(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    response = await client.get("/api/documents/records/DOC-NONE", headers=headers)
    assert response.status_code == 404
