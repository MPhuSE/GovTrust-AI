import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import embeddings, ekyc, health, hosobot, lawguard, ocr, smartbot
from app.config import get_settings
from app.container import AppContainer
from app.grpc_server import start_grpc_server


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    container = AppContainer(get_settings())
    app.state.container = container
    await container.initialize()
    grpc_server = await start_grpc_server(container)
    try:
        yield
    finally:
        await grpc_server.stop(grace=5)
        await container.close()


app = FastAPI(
    title="GovTrust AI Service",
    description="FastAPI + gRPC — Vietnamese hybrid RAG, OCR, HoSoBot and embeddings",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(ocr.router, prefix="/api/v1", tags=["OCR"])
app.include_router(ekyc.router, prefix="/api/v1", tags=["eKYC"])
app.include_router(hosobot.router, prefix="/api/v1", tags=["HoSoBot"])
app.include_router(smartbot.router, prefix="/api/v1", tags=["SmartBot"])
app.include_router(lawguard.router, prefix="/api/v1", tags=["LawGuard"])
app.include_router(embeddings.router, prefix="/api/v1", tags=["Embeddings"])
