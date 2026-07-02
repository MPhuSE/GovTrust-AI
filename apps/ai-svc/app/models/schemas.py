from typing import Any, Literal

from pydantic import BaseModel, Field


class FieldValue(BaseModel):
    value: str
    confidence: float


class LawGuardChecklistItem(BaseModel):
    id: str
    role_in_procedure: str = Field(default="", alias="roleInProcedure")

    model_config = {"populate_by_name": True}


class LawGuardRequest(BaseModel):
    procedure_code: str = Field(alias="procedureCode")
    checklist: list[LawGuardChecklistItem]
    category: str | None = None

    model_config = {"populate_by_name": True}


class LegalSource(BaseModel):
    title: str
    article: str = ""
    url: str = ""
    source_version: str = Field(default="", alias="sourceVersion")

    model_config = {"populate_by_name": True}


class LegalAlert(BaseModel):
    type: str
    checklist_item_id: str = Field(alias="checklistItemId")
    message: str
    legal_source: LegalSource = Field(alias="legalSource")
    confidence: float
    needs_verification: bool = Field(alias="needsVerification")

    model_config = {"populate_by_name": True}


class LawGuardResponse(BaseModel):
    alerts: list[LegalAlert]
    disclaimer: str


class LegalQueryRequest(BaseModel):
    query: str = Field(min_length=2)
    category: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class LegalAskRequest(BaseModel):
    question: str = Field(min_length=2)
    category: str | None = None
    top_k: int = Field(default=6, ge=1, le=12)


class EmbeddingRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=128)
    kind: Literal["query", "passage"] = "passage"


class SmartBotConsultRequest(BaseModel):
    question: str = Field(min_length=2, max_length=20_000)
    procedure_code: str = Field(alias="procedureCode")
    top_k: int = Field(default=5, ge=1, le=12)
    procedure_context: str = Field(default="", alias="procedureContext")

    model_config = {"populate_by_name": True}


class HoSoBotRequest(BaseModel):
    query: str = Field(min_length=2, max_length=20_000)
    session_id: str | None = None


class HoSoBotResponse(BaseModel):
    procedure_code: str | None = None
    procedure_name: str | None = None
    confidence: float
    message: str
    suggestions: list[str] = []


JsonDict = dict[str, Any]
