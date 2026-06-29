from fastapi import APIRouter, HTTPException
from app.models.schemas import LawGuardRequest, LawGuardResponse
from app.services.rag_engine import RAGEngine

router = APIRouter(prefix="/lawguard")
rag_engine = RAGEngine()


@router.post("/check", response_model=LawGuardResponse)
async def check_legal(request: LawGuardRequest):
    """LawGuard — tra cứu căn cứ pháp lý RAG (Bước 6)."""
    try:
        alerts = rag_engine.generate_alerts(
            checklist=request.checklist,
            procedure_code=request.procedure_code,
            category=request.category,
        )
        return LawGuardResponse(alerts=alerts, disclaimer=RAGEngine.get_disclaimer())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query_legal(body: dict):
    """Truy vấn trực tiếp văn bản pháp luật."""
    query = body.get("query", "")
    category = body.get("category")
    top_k = body.get("top_k", 5)

    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    results = rag_engine.retrieve(query, category=category, top_k=top_k)
    return {"results": results, "disclaimer": RAGEngine.get_disclaimer()}
