import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import ocr, crosscheck, lawguard, embeddings, health, hosobot
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Khởi động gRPC server song song với FastAPI."""
    from app.grpc_server import serve_grpc
    grpc_task = asyncio.create_task(serve_grpc(port=50051))
    yield
    grpc_task.cancel()
    try:
        await grpc_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="GovTrust AI Service",
    description="AI microservice — gRPC server (:50051) + REST docs (:8000)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(ocr.router, prefix="/api/v1", tags=["OCR"])
app.include_router(crosscheck.router, prefix="/api/v1", tags=["CrossCheck"])
app.include_router(lawguard.router, prefix="/api/v1", tags=["LawGuard"])
app.include_router(embeddings.router, prefix="/api/v1", tags=["Embeddings"])
app.include_router(hosobot.router, prefix="/api/v1", tags=["HoSoBot"])
