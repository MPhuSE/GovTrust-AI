from fastapi import APIRouter, HTTPException
from sentence_transformers import SentenceTransformer

router = APIRouter(prefix="/embeddings")

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("intfloat/multilingual-e5-base")
    return _model


@router.post("/encode")
async def encode_text(body: dict):
    """Tạo embedding cho văn bản (dùng để ingest pháp luật)."""
    texts = body.get("texts", [])
    if not texts:
        raise HTTPException(status_code=400, detail="texts is required")

    model = get_model()
    embeddings = model.encode(
        [f"passage: {t}" for t in texts],
        normalize_embeddings=True,
    ).tolist()

    return {"embeddings": embeddings, "model": "multilingual-e5-base", "dim": 768}
