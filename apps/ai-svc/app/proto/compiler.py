import importlib
import sys
from pathlib import Path

from grpc_tools import protoc

from app.config import REPO_ROOT


def load_stubs():
    output_dir = Path(__file__).resolve().parent
    proto_file = REPO_ROOT / "packages/proto/ai_service.proto"
    generated = output_dir / "ai_service_pb2.py"

    if not generated.exists() or generated.stat().st_mtime < proto_file.stat().st_mtime:
        result = protoc.main(
            [
                "grpc_tools.protoc",
                f"-I{proto_file.parent}",
                f"--python_out={output_dir}",
                f"--grpc_python_out={output_dir}",
                str(proto_file),
            ]
        )
        if result != 0:
            raise RuntimeError(f"Không generate được Python gRPC stubs (exit={result})")

    # grpc_tools sinh import ai_service_pb2 dạng top-level.
    if str(output_dir) not in sys.path:
        sys.path.insert(0, str(output_dir))
    pb2 = importlib.import_module("ai_service_pb2")
    pb2_grpc = importlib.import_module("ai_service_pb2_grpc")
    return pb2, pb2_grpc
