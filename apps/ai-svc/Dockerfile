FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    USE_TF=0 \
    TRANSFORMERS_NO_ADVISORY_WARNINGS=1

WORKDIR /app/apps/ai-svc

COPY apps/ai-svc/requirements.txt ./requirements.txt
COPY apps/ai-svc/requirements-local.txt ./requirements-local.txt
# Install the CPU wheel first so sentence-transformers does not pull the much
# larger CUDA-enabled PyTorch distribution into this API image.
RUN pip install --no-cache-dir \
      --index-url https://download.pytorch.org/whl/cpu \
      torch==2.6.0 && \
    pip install --no-cache-dir -r requirements-local.txt

COPY packages/proto /app/packages/proto
COPY data /app/data
COPY apps/ai-svc/app ./app

# Fail build sớm nếu shared proto không generate được cho Python.
RUN python -c "from app.proto.compiler import load_stubs; load_stubs()"

EXPOSE 8000 50051

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
