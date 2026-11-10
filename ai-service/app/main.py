from __future__ import annotations

import base64
import io
import json
from typing import Annotated

import httpx
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, Field

from .settings import settings

app = FastAPI(title="CityFix local AI service", version="1.0.0")

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGES = 5
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_SIDE = 1600


class AnalysisResult(BaseModel):
    category: str = "other"
    subcategory: str = "unknown"
    title: str
    description: str
    visual_observations: list[str] = Field(default_factory=list)
    severity: int = Field(ge=1, le=5)
    confidence: float = Field(ge=0, le=1)
    image_quality: str = "unknown"
    description_matches_image: bool | None = None
    discrepancies: list[str] = Field(default_factory=list)
    public_safety_risk: str = "unknown"
    recommended_action: str
    department: str = "Komuna"
    requires_human_review: bool = True
    suggested_priority: str = "normal"
    danger_level: int = Field(ge=1, le=5)
    danger_reason: str
    is_valid_municipal_issue: bool = True
    model_name: str


class TextAnalysisRequest(BaseModel):
    report_id: str | None = None
    description: str = Field(min_length=1, max_length=2000)
    language: str = Field(default="sq", max_length=10)


def _prompt(description: str, language: str) -> str:
    return f"""You are CityFix municipal vision assistant. Analyze the attached photographs.
Return only valid JSON with these keys:
category, subcategory, title, description, visual_observations, severity,
confidence, image_quality, description_matches_image, discrepancies,
public_safety_risk, recommended_action, department, requires_human_review,
suggested_priority, danger_level, danger_reason, is_valid_municipal_issue.
Use language {language}. Never invent coordinates or addresses. If evidence is weak,
set requires_human_review to true and lower confidence. Citizen description: {description or "none"}"""


def _prepare_image(data: bytes) -> bytes:
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")
    try:
        with Image.open(io.BytesIO(data)) as source:
            if source.format not in ALLOWED_FORMATS:
                raise HTTPException(status_code=415, detail="Only JPEG, PNG and WEBP are supported.")
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=88, optimize=True)
            return output.getvalue()
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=415, detail="The uploaded file is not a valid image.") from exc


def _encode_image(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _level(value: object, default: int = 1) -> int:
    if isinstance(value, (int, float)):
        return max(1, min(5, int(value)))
    text = str(value).lower()
    if any(word in text for word in ("high", "lartë", "urgent", "shumë")):
        return 4
    if any(word in text for word in ("medium", "mes", "moder")):
        return 3
    if any(word in text for word in ("low", "ulët", "asnjë", "none")):
        return 1
    return default


def _confidence(value: object) -> float:
    if isinstance(value, (int, float)):
        return max(0, min(1, float(value)))
    text = str(value).lower()
    if any(word in text for word in ("high", "lartë", "shumë")):
        return 0.85
    if any(word in text for word in ("medium", "mes", "moder")):
        return 0.6
    return 0.3


def _boolean(value: object, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    text = str(value).lower()
    if any(word in text for word in ("yes", "po", "true", "required")):
        return True
    if any(word in text for word in ("no", "jo", "false", "not")):
        return False
    return default


def _category(value: object, title: str, description: str) -> str:
    text = f"{value} {title} {description}".lower()
    aliases = {
        "pothole": ("pothole", "gropë", "grop"),
        "street_light": ("street light", "ndriç", "llamb"),
        "garbage": ("garbage", "mbetur", "plehr"),
        "traffic_sign": ("traffic sign", "shenj", "tabel"),
        "sidewalk": ("sidewalk", "trotuar"),
        "sewage": ("sewage", "drain", "kanal", "përmbyt"),
        "public_space_damage": ("park", "graffiti", "vandal", "hapësir"),
        "illegal_parking": ("parking", "parkim"),
    }
    for category, words in aliases.items():
        if any(word in text for word in words):
            return category
    return "other"


def _text_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if value is None:
        return []
    return [str(value)]


def _normalize_model_result(raw: str) -> dict:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="The vision model returned invalid JSON.") from exc
    if not isinstance(value, dict):
        raise HTTPException(status_code=502, detail="The vision model returned an invalid object.")
    title = str(value.get("title", "")).strip()
    description = str(value.get("description", "")).strip()
    if not title or not description:
        raise HTTPException(status_code=502, detail="The vision model omitted the report text.")
    severity = _level(value.get("severity", value.get("danger_level")))
    priority = str(value.get("suggested_priority", "normal")).lower()
    if "urgent" in priority or "critical" in priority:
        priority = "urgent"
    elif "high" in priority or "lartë" in priority:
        priority = "high"
    elif "low" in priority or "ulët" in priority:
        priority = "low"
    else:
        priority = "normal"
    return {
        "category": _category(value.get("category"), title, description),
        "subcategory": str(value.get("subcategory", "unknown")),
        "title": title,
        "description": description,
        "visual_observations": _text_list(value.get("visual_observations")),
        "severity": severity,
        "confidence": _confidence(value.get("confidence")),
        "image_quality": str(value.get("image_quality", "unknown")),
        "description_matches_image": _boolean(value.get("description_matches_image"), True),
        "discrepancies": _text_list(value.get("discrepancies")),
        "public_safety_risk": str(value.get("public_safety_risk", "unknown")),
        "recommended_action": str(value.get("recommended_action", "Kërkohet inspektim njerëzor.")),
        "department": str(value.get("department", "Komuna")),
        "requires_human_review": _boolean(value.get("requires_human_review"), True),
        "suggested_priority": priority,
        "danger_level": severity,
        "danger_reason": str(value.get("danger_reason", "Kërkohet verifikim njerëzor.")),
        "is_valid_municipal_issue": _boolean(value.get("is_valid_municipal_issue"), True),
        "model_name": settings.ollama_model,
    }


async def _ollama_generate(prompt: str, images: list[str]) -> dict:
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "images": images,
        "stream": False,
        "format": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
            response = await client.post(f"{settings.ollama_host.rstrip('/')}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="Ollama is unavailable.") from exc
    if not isinstance(data.get("response"), str):
        raise HTTPException(status_code=502, detail="Ollama returned an invalid response.")
    return _normalize_model_result(data["response"])


async def _model_available() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get(f"{settings.ollama_host.rstrip('/')}/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])
            return any(model.get("name") == settings.ollama_model for model in models)
    except (httpx.HTTPError, ValueError):
        return False


@app.get("/health")
async def health() -> dict:
    ollama_available = await _model_available()
    return {
        "status": "ok" if ollama_available else "degraded",
        "ollama_connected": ollama_available,
        "model_available": ollama_available,
        "model": settings.ollama_model,
    }


@app.get("/model/status")
async def model_status() -> dict:
    available = await _model_available()
    return {"model": settings.ollama_model, "ollama_connected": available, "model_available": available}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(
    report_id: Annotated[str | None, Form()] = None,
    description: Annotated[str, Form()] = "",
    language: Annotated[str, Form()] = "sq",
    photographs: Annotated[list[UploadFile], File()] = [],
    x_cityfix_ai_secret: Annotated[str | None, Header()] = None,
) -> AnalysisResult:
    if settings.ai_service_secret and x_cityfix_ai_secret != settings.ai_service_secret:
        raise HTTPException(status_code=401, detail="Invalid AI service credentials.")
    if not photographs or len(photographs) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail="Provide between one and five photographs.")
    encoded: list[str] = []
    for photograph in photographs:
        encoded.append(_encode_image(_prepare_image(await photograph.read())))
    result = await _ollama_generate(_prompt(description, language), encoded)
    return AnalysisResult(**result)


@app.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text(
    request: TextAnalysisRequest,
    x_cityfix_ai_secret: Annotated[str | None, Header()] = None,
) -> AnalysisResult:
    if settings.ai_service_secret and x_cityfix_ai_secret != settings.ai_service_secret:
        raise HTTPException(status_code=401, detail="Invalid AI service credentials.")
    result = await _ollama_generate(_prompt(request.description, request.language), [])
    return AnalysisResult(**result)
