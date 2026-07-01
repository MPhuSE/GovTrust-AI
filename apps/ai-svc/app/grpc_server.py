import logging

import grpc
from grpc import aio

from app.container import AppContainer
from app.proto.compiler import load_stubs
from app.services.rag import DISCLAIMER


logger = logging.getLogger(__name__)


async def start_grpc_server(container: AppContainer) -> aio.Server:
    pb2, pb2_grpc = load_stubs()

    class AIServicer(pb2_grpc.AIServiceServicer):
        async def ExtractOCR(self, request, context):
            try:
                result = await container.ocr.extract(
                    request.image_data,
                    request.document_type_code,
                    request.run_liveness,
                )
                return pb2.OCRResponse(
                    checklist_id=request.checklist_id,
                    provider="VNPT_EKYC" if container.ocr.configured else "MOCK",
                    fields={
                        key: pb2.FieldValue(
                            value=str(value["value"]), confidence=float(value["confidence"])
                        )
                        for key, value in result.fields.items()
                    },
                    avg_confidence=result.avg_confidence,
                    liveness=bool(result.liveness),
                    processing_time_ms=result.processing_time_ms,
                )
            except Exception as exc:
                await context.abort(grpc.StatusCode.INTERNAL, str(exc))

        async def CheckLawGuard(self, request, context):
            try:
                alerts = await container.rag.generate_alerts(
                    [
                        {"id": item.id, "roleInProcedure": item.role_in_procedure}
                        for item in request.checklist
                    ],
                    request.procedure_code,
                    request.category or None,
                )
                return pb2.LawGuardResponse(
                    alerts=[
                        pb2.LegalAlert(
                            type=alert.type,
                            message=alert.message,
                            confidence=alert.confidence,
                            needs_verification=alert.needs_verification,
                            source_title=alert.legal_source.title,
                            source_article=alert.legal_source.article,
                            source_url=alert.legal_source.url,
                        )
                        for alert in alerts
                    ],
                    disclaimer=DISCLAIMER,
                )
            except Exception as exc:
                await context.abort(grpc.StatusCode.INTERNAL, str(exc))

        async def IdentifyProcedure(self, request, context):
            try:
                result = await container.hosobot.identify(
                    request.query, request.session_id or None
                )
                return pb2.IdentifyResponse(
                    procedure_code=result.get("intent") or "",
                    confidence=float(result.get("confidence", 0)),
                    message=result.get("message", ""),
                )
            except Exception as exc:
                await context.abort(grpc.StatusCode.INTERNAL, str(exc))

    server = aio.server()
    pb2_grpc.add_AIServiceServicer_to_server(AIServicer(), server)
    bound_port = server.add_insecure_port(container.settings.grpc_bind)
    if bound_port == 0:
        raise RuntimeError(f"Không bind được gRPC tại {container.settings.grpc_bind}")
    await server.start()
    logger.info("gRPC AIService listening on %s", container.settings.grpc_bind)
    return server
