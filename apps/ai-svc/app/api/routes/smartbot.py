from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_container
from app.container import AppContainer
from app.models.schemas import SmartBotConsultRequest


router = APIRouter(prefix="/smartbot")


@router.post("/consult")
async def consult(
    request: SmartBotConsultRequest,
    container: AppContainer = Depends(get_container),
):
    try:
        return await container.smartbot.consult(
            request.question,
            request.procedure_code,
            request.top_k,
            request.procedure_context,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
