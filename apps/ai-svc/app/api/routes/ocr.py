import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.dependencies import get_container
from app.container import AppContainer


router = APIRouter(prefix="/ocr")


@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    document_type_code: str = Form("CCCD"),
    checklist_id: str = Form(...),
    run_liveness: bool = Form(False),
    container: AppContainer = Depends(get_container),
):
    try:
        result = await container.ocr.extract(
            await file.read(), document_type_code, run_liveness
        )
        return {
            "provider": "VNPT_EKYC" if container.ocr.configured else "MOCK",
            "checklistId": checklist_id,
            "documentTypeCode": document_type_code,
            "extractedFields": result.fields,
            "avgConfidence": result.avg_confidence,
            "liveness": result.liveness,
            "processingTimeMs": result.processing_time_ms,
        }
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"VNPT API error: {exc.response.text}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
