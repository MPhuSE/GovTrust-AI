import logging

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.dependencies import get_container
from app.container import AppContainer

logger = logging.getLogger(__name__)

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
        body = exc.response.text
        logger.error("VNPT HTTP %s: %s", exc.response.status_code, body[:400])
        raise HTTPException(
            status_code=502,
            detail=f"VNPT API lỗi {exc.response.status_code}: {body[:200]}",
        ) from exc
    except httpx.HTTPError as exc:
        # ConnectError, TimeoutException, ... — không phải HTTP status error
        logger.error("VNPT network error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Không kết nối được VNPT: {exc}") from exc
    except RuntimeError as exc:
        # VD: VNPT addFile trả 200 nhưng không có hash (token hết hạn, format lạ)
        logger.error("eKYC runtime error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("eKYC unexpected error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
