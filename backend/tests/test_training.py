"""学習データの書き出しと評価。

ここが誤っていると、学習しても効果が出ない、あるいは
悪いデータで学習して品質が下がる。
"""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

from tests.conftest import auth_headers
from tests.test_documents import AI_RESPONSE, PAYLOAD


def _patch_generate() -> AsyncMock:
    return AsyncMock(return_value=AI_RESPONSE)


async def _generate(client: AsyncClient) -> str:
    with patch("app.routers.documents.generate_content", new=_patch_generate()), patch(
        "app.routers.documents.send_document_mail", new=AsyncMock(return_value=True)
    ):
        response = await client.post("/api/documents", json=PAYLOAD)
    return response.json()["reference"]


async def _revise(
    client: AsyncClient, headers: dict[str, str], reference: str, text: str
) -> None:
    await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"serviceOverview": text}},
        headers=headers,
    )


# --------------------------------------------------------------- 書き出し


async def test_件数不足なら書き出しを拒否する(client: AsyncClient) -> None:
    """足りないまま学習しても文体は安定せず、費用と時間だけがかかる。"""
    headers = await auth_headers(client)
    reference = await _generate(client)
    await _revise(client, headers, reference, "直した本文")

    response = await client.get("/api/documents/training/export", headers=headers)

    assert response.status_code == 409
    assert "不足" in response.json()["message"]


async def test_forceを付ければ書き出せる(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)
    await _revise(client, headers, reference, "人が直した本文")

    response = await client.get(
        "/api/documents/training/export?force=true", headers=headers
    )

    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("application/jsonl")
    lines = [ln for ln in response.text.splitlines() if ln.strip()]
    assert len(lines) == 1


async def test_書き出し形式がOpenAIの学習形式になっている(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)
    await _revise(client, headers, reference, "人が直した本文")

    response = await client.get(
        "/api/documents/training/export?force=true", headers=headers
    )
    example = json.loads(response.text.splitlines()[0])

    roles = [m["role"] for m in example["messages"]]
    assert roles == ["system", "user", "assistant"]


async def test_正解は人が直した後の内容(client: AsyncClient) -> None:
    """AIの出力をそのまま正解にすると、AIの出力でAIを学習させることになる。"""
    headers = await auth_headers(client)
    reference = await _generate(client)
    await _revise(client, headers, reference, "人が直した本文")

    response = await client.get(
        "/api/documents/training/export?force=true", headers=headers
    )
    example = json.loads(response.text.splitlines()[0])
    answer = json.loads(example["messages"][2]["content"])

    assert answer["serviceOverview"] == "人が直した本文"
    assert answer["serviceOverview"] != "サービス概要の本文"


async def test_プロンプトは生成時と同じ組み立てを通る(client: AsyncClient) -> None:
    """学習時と本番でプロンプトが違うと、学習しても効果が出ない。"""
    headers = await auth_headers(client)
    generate_mock = _patch_generate()
    with patch("app.routers.documents.generate_content", new=generate_mock), patch(
        "app.routers.documents.send_document_mail", new=AsyncMock(return_value=True)
    ):
        response = await client.post("/api/documents", json=PAYLOAD)
    reference = response.json()["reference"]
    generation_prompt, generation_info = generate_mock.await_args.args

    await _revise(client, headers, reference, "直した本文")
    export_response = await client.get(
        "/api/documents/training/export?force=true", headers=headers
    )
    example = json.loads(export_response.text.splitlines()[0])
    user_content = example["messages"][1]["content"]

    # 生成時のプロンプト本文が、そのまま学習例の user に含まれている
    assert generation_prompt in user_content
    for value in generation_info.values():
        assert value in user_content


async def test_手直しの無いものは学習対象にならない(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    await _generate(client)  # 手直しなし

    response = await client.get(
        "/api/documents/training/export?force=true", headers=headers
    )

    assert response.text.strip() == ""


async def test_却下したものは学習対象にならない(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)
    await _revise(client, headers, reference, "直した本文")
    await client.patch(
        f"/api/documents/records/{reference}/status",
        json={"status": "rejected"},
        headers=headers,
    )

    response = await client.get(
        "/api/documents/training/export?force=true", headers=headers
    )

    assert response.text.strip() == ""


async def test_検証用に分割される(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    for i in range(5):
        reference = await _generate(client)
        await _revise(client, headers, reference, f"直した本文{i}")

    train = await client.get(
        "/api/documents/training/export?force=true&split=train", headers=headers
    )
    validation = await client.get(
        "/api/documents/training/export?force=true&split=validation", headers=headers
    )

    train_lines = [ln for ln in train.text.splitlines() if ln.strip()]
    validation_lines = [ln for ln in validation.text.splitlines() if ln.strip()]
    assert len(train_lines) + len(validation_lines) == 5
    assert len(validation_lines) >= 1


async def test_書き出し前の件数確認ができる(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)
    await _revise(client, headers, reference, "直した本文")

    summary = (
        await client.get("/api/documents/training/summary", headers=headers)
    ).json()

    assert summary["trainable"] == 1
    assert summary["minimum_required"] == 100
    assert summary["ready"] is False


# --------------------------------------------------------------- 評価


async def test_手直しの量から品質を測れる(client: AsyncClient) -> None:
    headers = await auth_headers(client)
    reference = await _generate(client)
    await _revise(client, headers, reference, "まったく違う本文に書き換えた")

    result = (
        await client.get("/api/documents/training/evaluation", headers=headers)
    ).json()

    assert result["documents"] == 1
    assert result["untouched_rate"] == 0.0
    # 1節だけ大きく書き換えたので、全体の類似度は 1.0 未満
    assert 0.0 < result["mean_similarity"] < 1.0


async def test_手直しの無い資料は満点として数える(client: AsyncClient) -> None:
    """除外すると、出来の良い資料ほど評価から抜け落ちる。"""
    headers = await auth_headers(client)
    await _generate(client)

    result = (
        await client.get("/api/documents/training/evaluation", headers=headers)
    ).json()

    assert result["untouched_rate"] == 1.0
    assert result["mean_similarity"] == 1.0


async def test_苦手な節が特定できる(client: AsyncClient) -> None:
    """改善の優先順位を決める材料になる。"""
    headers = await auth_headers(client)
    reference = await _generate(client)
    await client.post(
        f"/api/documents/records/{reference}/revisions",
        json={"sections": {"riskManagement": "全面的に書き直したリスク管理の本文"}},
        headers=headers,
    )

    result = (
        await client.get("/api/documents/training/evaluation", headers=headers)
    ).json()

    by_key = {s["key"]: s for s in result["sections"]}
    assert by_key["riskManagement"]["edit_rate"] == 1.0
    assert by_key["serviceOverview"]["edit_rate"] == 0.0
    assert "リスク管理" in result["worst_sections"]


# --------------------------------------------------------------- 認証


async def test_学習データ関連は認証必須(client: AsyncClient) -> None:
    for path in (
        "/api/documents/training/export",
        "/api/documents/training/summary",
        "/api/documents/training/evaluation",
    ):
        assert (await client.get(path)).status_code == 401
