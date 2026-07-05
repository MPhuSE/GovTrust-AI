import logging

import grpc
from grpc import aio

from app.container import AppContainer
from app.proto.compiler import load_stubs
from app.services.ocr import OcrUnavailableError, UnsupportedDocumentType
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
                )
                return pb2.OCRResponse(
                    checklist_id=request.checklist_id,
                    provider="VNPT_EKYC" if request.document_type_code in ("CCCD", "CMND") else "VNPT_SMARTREADER",
                    fields={
                        key: pb2.FieldValue(
                            value=str(value["value"]), confidence=float(value["confidence"])
                        )
                        for key, value in result.fields.items()
                    },
                    avg_confidence=result.avg_confidence,
                    liveness=bool(result.liveness),
                    processing_time_ms=result.processing_time_ms,
                    image_quality=pb2.ImageQuality(
                        is_blurry=bool(result.image_quality.get("isBlurry", False)),
                        brightness=float(result.image_quality.get("brightness", 0)),
                        resolution=str(result.image_quality.get("resolution", "")),
                        ocr_confidence=float(result.image_quality.get("ocrConfidence", result.avg_confidence)),
                    ),
                )
            except UnsupportedDocumentType as exc:
                await context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(exc))
            except OcrUnavailableError as exc:
                await context.abort(grpc.StatusCode.FAILED_PRECONDITION, str(exc))
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
                    request.procedure_name or None,
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

        async def SemanticFieldCheck(self, request, context):
            try:
                verdicts = await container.semantic.check(
                    [
                        {
                            "field": pair.field,
                            "left": pair.left,
                            "right": pair.right,
                            "kind": pair.kind or "generic",
                        }
                        for pair in request.pairs
                    ]
                )
                return pb2.SemanticCheckResponse(
                    verdicts=[
                        pb2.SemanticVerdict(
                            field=v.field,
                            equivalent=v.equivalent,
                            confidence=v.confidence,
                            reason=v.reason,
                            canonical_left=v.canonical_left,
                            canonical_right=v.canonical_right,
                        )
                        for v in verdicts
                    ],
                )
            except Exception as exc:
                await context.abort(grpc.StatusCode.INTERNAL, str(exc))

        async def IngestEmbeddings(self, request, context):
            try:
                ingested = await container.search.ingest(
                    [
                        {
                            "chunkId": item.chunk_id,
                            "text": item.text,
                            "title": item.title,
                            "article": item.article,
                            "url": item.url,
                            "sourceVersion": item.source_version,
                            "category": item.category,
                        }
                        for item in request.chunks
                    ]
                )
                return pb2.EmbeddingIngestResponse(
                    ingested=ingested,
                    model=container.embeddings.model_name,
                    dimension=container.embeddings.dimension,
                )
            except ValueError as exc:
                await context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(exc))
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
