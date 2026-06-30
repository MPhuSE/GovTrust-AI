from pydantic import BaseModel


class OCRRequest(BaseModel):
    session_id: str
    document_type_code: str
    checklist_id: str


class OCRResponse(BaseModel):
    provider: str
    checklist_id: str
    document_type_code: str
    extracted_fields: dict
    avg_confidence: float
    liveness: bool | None = None
    processing_time_ms: int


class LawGuardRequest(BaseModel):
    procedure_code: str
    checklist: list[dict]
    category: str | None = None


class LawGuardResponse(BaseModel):
    alerts: list[dict]
    disclaimer: str


class HoSoBotRequest(BaseModel):
    query: str
    session_id: str | None = None


class HoSoBotResponse(BaseModel):
    procedure_code: str | None = None
    procedure_name: str | None = None
    confidence: float
    message: str
    suggestions: list[str] = []
