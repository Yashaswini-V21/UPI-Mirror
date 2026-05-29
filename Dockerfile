# Multi-stage Dockerfile optimized for Railway free tier
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

RUN apt-get update && \
    apt-get install -y build-essential gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Final runtime image
FROM python:3.11-slim

# Copy dependencies from builder
COPY --from=builder /install /usr/local

# Create non-root user for security
RUN addgroup --system kira && \
    adduser --system --ingroup kira --no-create-home kira

# Setup application directory
WORKDIR /app
COPY src/ ./src/
COPY api/ ./api/

# Create and set permissions for coach_memory directory
RUN mkdir -p .coach_memory && \
    chown -R kira:kira /app

# Switch to non-root user
USER kira

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start application
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
