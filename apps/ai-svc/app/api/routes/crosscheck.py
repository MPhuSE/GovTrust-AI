from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/crosscheck")


@router.post("/run")
async def run_crosscheck(body: dict):
    """
    CrossCheck — đối chiếu chéo đa giấy tờ.
    Logic chính nằm ở packages/rule-engine (TypeScript) trong NestJS.
    Endpoint này dành cho trường hợp AI Gateway cần chạy độc lập.
    """
    documents = body.get("documents", [])
    rules = body.get("crossCheckRules", [])

    if not documents or not rules:
        raise HTTPException(status_code=400, detail="documents và crossCheckRules là bắt buộc")

    # Delegate logic sang Rule Engine qua NestJS
    return {"message": "CrossCheck được xử lý bởi Rule Engine trong NestJS Scoring Module"}
