# Multi-stage Dockerfile for STRUCTURA AI Backend
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for OpenCV and builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final production stage
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app

# Copy application source code
COPY backend/ /app/backend/
COPY alembic.ini /app/alembic.ini
COPY seed_demo_data.py /app/seed_demo_data.py
COPY .env.example /app/.env

# Create data directories
RUN mkdir -p /app/backend/uploads /app/backend/processed

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
