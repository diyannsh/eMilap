import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    service: str

@router.get("/live", response_model=HealthResponse)
async def live() -> HealthResponse:
    return HealthResponse(status="ok", service="ai")

@router.get("/ready")
async def ready() -> dict:
    provider = os.getenv("EMBEDDING_PROVIDER", "none")
    is_ready = provider != "none" and bool(os.getenv("EMBEDDING_MODEL_LOADED"))
    return {
        "status": "ok" if is_ready else "degraded",
        "service": "ai",
        "dependencies": {
            "embedding_provider": "available" if is_ready else "unconfigured",
            "deterministic_fallback": True,
        },
    }
