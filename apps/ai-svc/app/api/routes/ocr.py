import httpx
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.vnpt_ocr import VNPTOCRClient
from app.services.ocr_normalizer import normalize_ocr_result

router = APIRouter(prefix="/ocr")
vnpt_client = VNPTOCRClient()


@router.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    document_type_code: str = Form("CCCD"),
    checklist_id: str = Form(...),
    run_liveness: bool = Form(False),
):
    """Bóc tách thông tin giấy tờ qua VNPT eKYC OCR (Bước 3)."""
    try:
        contents = await file.read()

        raw_result = await vnpt_client.ocr_id_card(contents, document_type_code)
        normalized = normalize_ocr_result(raw_result, document_type_code)

        liveness_result = None
        if run_liveness:
            liveness_data = await vnpt_client.liveness_check(contents)
            liveness_result = liveness_data.get("is_live", True)

        return {
            "provider": "VNPT_EKYC",
            "checklistId": checklist_id,
            "documentTypeCode": document_type_code,
            "extractedFields": normalized["fields"],
            "avgConfidence": normalized["avg_confidence"],
            "liveness": liveness_result,
            "processingTimeMs": normalized["processing_time_ms"],
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"VNPT API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
