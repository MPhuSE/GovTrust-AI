from app.proto.compiler import load_stubs


def test_shared_ai_proto_generates_python_contract():
    pb2, pb2_grpc = load_stubs()

    assert hasattr(pb2, "OCRRequest")
    assert hasattr(pb2, "LawGuardRequest")
    assert hasattr(pb2, "EmbeddingIngestRequest")
    assert hasattr(pb2_grpc, "AIServiceServicer")
