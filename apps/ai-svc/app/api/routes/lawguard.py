from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_container
from app.container import AppContainer
from app.models.schemas import (
    LawGuardRequest,
    LawGuardResponse,
    LegalAskRequest,
    LegalQueryRequest,
)
from app.services.rag import DISCLAIMER


router = APIRouter(prefix="/lawguard")


@router.post("/check", response_model=LawGuardResponse)
async def check(
    request: LawGuardRequest,
    container: AppContainer = Depends(get_container),
):
    alerts = await container.rag.generate_alerts(
        [item.model_dump(by_alias=True) for item in request.checklist],
        request.procedure_code,
        request.category,
        request.procedure_name,
    )
    return LawGuardResponse(alerts=alerts, disclaimer=DISCLAIMER)


@router.post("/query")
async def query(
    request: LegalQueryRequest,
    container: AppContainer = Depends(get_container),
):
    results = await container.rag.retrieve(request.query, request.category, request.top_k)
    return {
        "results": [
            {
                "content": result.text,
                "relevanceScore": result.score,
                "source": {
                    "title": result.title,
                    "article": result.article,
                    "url": result.url,
                    "sourceVersion": result.source_version,
                },
            }
            for result in results
        ],
        "disclaimer": DISCLAIMER,
    }


@router.post("/ask")
async def ask(
    request: LegalAskRequest,
    container: AppContainer = Depends(get_container),
):
    try:
        return await container.rag.answer(request.question, request.category, request.top_k)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
