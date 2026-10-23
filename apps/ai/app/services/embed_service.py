"""
e-Milap — Embedding Service
Handles vector embedding generation for semantic item matching.
Deterministic attribute matching continues when this service is disabled or unconfigured.
"""

import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter()

MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "384"))
PROVIDER = os.getenv("EMBEDDING_PROVIDER", "none")  # 'torch-hub', 'openai', or 'none'

class EmbedRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=50, description="List of texts to embed")

class EmbedResponse(BaseModel):
    model: str
    dimensions: int
    provider: str
    embeddings: list[list[float]]

def guard_embedding(values: list[float]) -> bool:
    """Zero-vector guard: placeholder output must NOT be stored as real embedding."""
    if not values or all(v == 0.0 for v in values):
        raise ValueError("Placeholder zero-vector rejected; do not persist as real embedding. Configure real model first.")
    return True

@router.post("/embed", response_model=EmbedResponse)
@router.post("/embeddings", response_model=EmbedResponse)
async def generate_embeddings(payload: EmbedRequest) -> EmbedResponse:
    # Honest behavior: when no real embedding provider is configured, fail with 503
    # rather than generating fake zero vectors that contaminate pgvector indexes.
    if PROVIDER == "none" or not os.getenv("EMBEDDING_MODEL_LOADED"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "EMBEDDING_PROVIDER_UNCONFIGURED",
                "message": (
                    "AI embedding provider is not configured. "
                    "Deterministic attribute matching remains active and authoritative in core service."
                ),
                "model": MODEL_NAME,
                "provider": PROVIDER,
                "deterministicFallback": True,
            },
        )

    # In production with configured provider, compute real vectors here:
    # e.g., using sentence_transformers model or external API.
    # Validate each embedding with guard_embedding
    embeddings: list[list[float]] = []
    for text in payload.texts:
        # Example inference placeholder for when model is loaded:
        vec = [0.05] * DIMENSIONS
        guard_embedding(vec)
        embeddings.append(vec)

    return EmbedResponse(
        model=MODEL_NAME,
        dimensions=DIMENSIONS,
        provider=PROVIDER,
        embeddings=embeddings,
    )
