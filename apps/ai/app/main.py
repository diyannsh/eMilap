from fastapi import FastAPI
from .routers import health
from .services import embed_service

app = FastAPI(title="FoundNear AI Service")
app.include_router(health.router, prefix="/health")
app.include_router(embed_service.router)
