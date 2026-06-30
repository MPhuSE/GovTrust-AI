"""
gRPC server cho ai-svc.
Chạy song song với FastAPI trong main.py.
Implement AIService từ packages/proto/ai_service.proto.
"""

import asyncio
import grpc
from grpc import aio
from pathlib import Path

PROTO_DIR = Path(__file__).parent.parent.parent.parent / "packages" / "proto"


def load_proto_stubs():
    """Load proto stubs — generated bằng grpc_tools.protoc hoặc grpc.experimental.gevent."""
    import grpc.experimental.gevent as grpc_gevent  # noqa
    try:
        from app.proto import ai_service_pb2, ai_service_pb2_grpc
        return ai_service_pb2, ai_service_pb2_grpc
    except ImportError:
        return None, None


class AIServicer:
    """
    Implement gRPC AIService.
    Được gọi bởi core-svc khi cần OCR, LawGuard, HoSoBot.
    """

    def __init__(self):
        from app.services.vnpt_ocr import VNPTOCRClient
        from app.services.ocr_normalizer import normalize_ocr_result
        from app.services.rag_engine import RAGEngine
        from app.services.vnpt_smartbot import VNPTSmartBotClient
        from app.api.routes.hosobot import _keyword_fallback

        self._ocr_client = VNPTOCRClient()
        self._ocr_normalizer = normalize_ocr_result
        self._rag_engine = RAGEngine()
        self._smartbot = VNPTSmartBotClient()
        self._keyword_fallback = _keyword_fallback

    async def ExtractOCR(self, request, context):
        """Bóc tách thông tin giấy tờ qua VNPT eKYC OCR."""
        from app.proto import ai_service_pb2
        try:
            raw = await self._ocr_client.ocr_id_card(request.image_data, request.document_type_code)
            normalized = self._ocr_normalizer(raw, request.document_type_code)

            liveness = False
            if request.run_liveness:
                lv = await self._ocr_client.liveness_check(request.image_data)
                liveness = lv.get("is_live", False)

            fields = {
                k: ai_service_pb2.FieldValue(value=str(v["value"]), confidence=float(v["confidence"]))
                for k, v in normalized["fields"].items()
            }
            return ai_service_pb2.OCRResponse(
                checklist_id=request.checklist_id,
                provider="VNPT_EKYC",
                fields=fields,
                avg_confidence=normalized["avg_confidence"],
                liveness=liveness,
                processing_time_ms=normalized.get("processing_time_ms", 0),
            )
        except Exception as e:
            await context.abort(grpc.StatusCode.INTERNAL, str(e))

    async def CheckLawGuard(self, request, context):
        """RAG LawGuard — truy xuất văn bản pháp luật."""
        from app.proto import ai_service_pb2
        checklist = [{"id": c.id, "roleInProcedure": c.role_in_procedure} for c in request.checklist]
        alerts_data = self._rag_engine.generate_alerts(checklist, request.procedure_code, request.category or None)

        alerts = [
            ai_service_pb2.LegalAlert(
                type=a["type"],
                message=a["message"],
                confidence=a["confidence"],
                needs_verification=a["needsVerification"],
                source_title=a["legalSource"].get("title", ""),
                source_article=a["legalSource"].get("article", ""),
                source_url=a["legalSource"].get("url", ""),
            )
            for a in alerts_data
        ]
        return ai_service_pb2.LawGuardResponse(
            alerts=alerts,
            disclaimer=self._rag_engine.get_disclaimer(),
        )

    async def IdentifyProcedure(self, request, context):
        """HoSoBot — nhận diện thủ tục từ câu hỏi tự nhiên."""
        from app.proto import ai_service_pb2
        import httpx
        try:
            result = await self._smartbot.chat(request.query, request.session_id or None)
            procedure_code = result.get("intent") or self._keyword_fallback(request.query) or ""
            return ai_service_pb2.IdentifyResponse(
                procedure_code=procedure_code,
                confidence=result.get("confidence", 0.8),
                message=result.get("message", ""),
            )
        except httpx.HTTPStatusError:
            code = self._keyword_fallback(request.query) or ""
            return ai_service_pb2.IdentifyResponse(
                procedure_code=code,
                confidence=0.5 if code else 0.0,
                message="Fallback: vui lòng chọn thủ tục từ danh sách.",
            )


async def serve_grpc(port: int = 50051):
    """Khởi động gRPC server bất đồng bộ."""
    try:
        from app.proto import ai_service_pb2_grpc
    except ImportError:
        print("⚠ Proto stubs chưa được generate. Chạy: pnpm --filter @govtrust/proto gen:py")
        return

    server = aio.server()
    ai_service_pb2_grpc.add_AIServiceServicer_to_server(AIServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    await server.start()
    print(f"✓ gRPC AIService listening on :{port}")
    await server.wait_for_termination()
