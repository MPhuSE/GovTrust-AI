import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.dependencies import get_container
from app.container import AppContainer

router = APIRouter(prefix="/ekyc")


@router.post("/verify")
async def verify_ekyc(
    front: UploadFile = File(...),
    back: UploadFile = File(...),
    selfie: UploadFile = File(...),
    container: AppContainer = Depends(get_container),
):
    try:
        result = await container.ekyc.full_verify(
            await front.read(), await back.read(), await selfie.read()
        )
        return {
            "verified": result.verified,
            "ocrFields": result.ocr_fields,
            "matchFrontBack": result.match_front_back,
            "faceMatch": result.face_match,
            "faceMatchProb": result.face_match_prob,
            "liveness": result.liveness,
            "livenessProb": result.liveness_prob,
            "warnings": result.warnings,
            "processingTimeMs": result.processing_time_ms,
        }
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"VNPT API error: {exc.response.text}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
