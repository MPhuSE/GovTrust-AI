import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.dependencies import get_container
from app.container import AppContainer
from app.services.ocr import (
    DocumentTypeMismatch,
    OcrUnavailableError,
    UnsupportedDocumentType,
)


router = APIRouter(prefix="/ocr")


@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    document_type_code: str = Form("GIAY_KHAI_SINH"),
    checklist_id: str = Form("auto"),
    container: AppContainer = Depends(get_container),
):
    try:
        result = await container.ocr.extract(await file.read(), document_type_code)
        return {
            "provider": "VNPT_EKYC" if document_type_code in {"CCCD", "CMND"} else "VNPT_SMARTREADER",
            "checklistId": checklist_id,
            "documentTypeCode": document_type_code,
            "extractedFields": result.fields,
            "avgConfidence": result.avg_confidence,
            "imageQuality": result.image_quality,
            "processingTimeMs": result.processing_time_ms,
        }
    except DocumentTypeMismatch as exc:
        # 422: ảnh sai loại giấy tờ — core-svc bắt mã này để buộc upload lại.
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except UnsupportedDocumentType as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OcrUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"VNPT API error: {exc.response.text}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
