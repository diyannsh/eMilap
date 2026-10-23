from fastapi import FastAPI
from .routers import health

app = FastAPI(title="e-Milap AI Service")
app.include_router(health.router, prefix="/health")
