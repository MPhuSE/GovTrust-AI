from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_container
from app.container import AppContainer
from app.models.schemas import EmbeddingRequest


router = APIRouter(prefix="/embeddings")


@router.post("/encode")
async def encode(
    request: EmbeddingRequest,
    container: AppContainer = Depends(get_container),
):
    try:
        vectors = await container.embeddings.embed(request.texts, request.kind)
        return {
            "embeddings": vectors,
            "model": container.embeddings.model_name,
            "dimension": container.embeddings.dimension,
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
