from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.main import _normalize_model_result, app


def _image() -> bytes:
    output = BytesIO()
    Image.new("RGB", (20, 20), "gray").save(output, format="JPEG")
    return output.getvalue()


def test_rejects_empty_photographs() -> None:
    response = TestClient(app).post("/analyze", data={"description": "problem"})
    assert response.status_code == 400


def test_rejects_invalid_image() -> None:
    response = TestClient(app).post(
        "/analyze",
        data={"description": "problem"},
        files=[("photographs", ("bad.jpg", b"not-an-image", "image/jpeg"))],
    )
    assert response.status_code == 415


def test_accepts_valid_image_before_ollama_call(monkeypatch) -> None:
    async def fake_generate(prompt: str, images: list[str]) -> dict:
        assert images
        return {
            "category": "pothole",
            "subcategory": "road",
            "title": "Gropë në rrugë",
            "description": "Dëmtim i dukshëm në sipërfaqen e rrugës.",
            "visual_observations": ["Sipërfaqe e dëmtuar"],
            "severity": 3,
            "confidence": 0.8,
            "image_quality": "good",
            "description_matches_image": True,
            "discrepancies": [],
            "public_safety_risk": "medium",
            "recommended_action": "Inspektim dhe riparim",
            "department": "Infrastruktura",
            "requires_human_review": True,
            "suggested_priority": "normal",
            "danger_level": 3,
            "danger_reason": "Mund të rrezikojë trafikun.",
            "is_valid_municipal_issue": True,
            "model_name": "qwen3-vl:8b",
        }

    monkeypatch.setattr("app.main._ollama_generate", fake_generate)
    response = TestClient(app).post(
        "/analyze",
        data={"description": "gropë", "language": "sq"},
        files=[("photographs", ("road.jpg", _image(), "image/jpeg"))],
    )
    assert response.status_code == 200
    assert response.json()["category"] == "pothole"


def test_accepts_multiple_images(monkeypatch) -> None:
    async def fake_generate(prompt: str, images: list[str]) -> dict:
        assert len(images) == 2
        return {
            "category": "other",
            "title": "Problem i mundshëm",
            "description": "Kërkohet verifikim në terren.",
            "severity": 1,
            "confidence": 0.2,
            "recommended_action": "Inspektim",
            "danger_level": 1,
            "danger_reason": "Nuk ka prova të mjaftueshme.",
            "model_name": "qwen3-vl:8b",
        }

    monkeypatch.setattr("app.main._ollama_generate", fake_generate)
    response = TestClient(app).post(
        "/analyze",
        data={"description": "dy fotografi", "language": "sq"},
        files=[
            ("photographs", ("one.jpg", _image(), "image/jpeg")),
            ("photographs", ("two.jpg", _image(), "image/jpeg")),
        ],
    )
    assert response.status_code == 200


def test_normalizes_noncanonical_model_values() -> None:
    result = _normalize_model_result(
        '{"category":"Probleme Teknike","title":"Gropë","description":"Dëmtim i dukshëm",'
        '"visual_observations":"Sipërfaqe e dëmtuar","severity":"E ulët",'
        '"confidence":"E ulët","requires_human_review":"Po","is_valid_municipal_issue":"Jo"}'
    )
    assert result["category"] == "pothole"
    assert result["visual_observations"] == ["Sipërfaqe e dëmtuar"]
    assert result["requires_human_review"] is True
