# ==============================================================================
# FoundNear AI — Python AI Matching Service Dockerfile
# ==============================================================================

FROM python:3.11-slim AS runner

WORKDIR /app

# Prevent Python from writing .pyc and buffer stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install runtime dependencies and curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r foundnear && useradd -r -g foundnear foundnear

# Copy dependency specifications
COPY apps/ai/pyproject.toml ./

# Install python dependencies
RUN pip install --no-cache-dir .

# Copy application source code
COPY apps/ai/app ./app

# Set non-root user
USER foundnear

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health/live || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
