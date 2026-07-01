from fastapi import APIRouter, Depends

from app.api.dependencies import get_container
from app.container import AppContainer


router = APIRouter()


@router.get("/health")
async def health(container: AppContainer = Depends(get_container)):
    return {
        "status": "ok",
        "service": "ai-svc",
        "runtime": "fastapi",
        "retrieval": {
            "dense": "ready" if container.search.dense_ready else "degraded",
            "lexical": "ready" if container.search.bm25 else "empty",
            "documents": len(container.search.documents),
        },
    }
