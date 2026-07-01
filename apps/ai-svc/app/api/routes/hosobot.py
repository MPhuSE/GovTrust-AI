from fastapi import APIRouter, Depends

from app.api.dependencies import get_container
from app.container import AppContainer
from app.models.schemas import HoSoBotRequest, HoSoBotResponse


router = APIRouter(prefix="/hosobot")


@router.post("/identify", response_model=HoSoBotResponse)
async def identify(
    request: HoSoBotRequest,
    container: AppContainer = Depends(get_container),
):
    result = await container.hosobot.identify(request.query, request.session_id)
    return HoSoBotResponse(
        procedure_code=result.get("intent"),
        procedure_name=result.get("procedure_name"),
        confidence=float(result.get("confidence", 0)),
        message=result.get("message", ""),
        suggestions=result.get("suggestions", []),
    )
