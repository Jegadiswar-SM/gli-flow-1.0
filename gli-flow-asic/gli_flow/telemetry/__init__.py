from gli_flow.telemetry.parser import TelemetryParser
from gli_flow.telemetry.upload_queue import UploadQueue
from gli_flow.telemetry.retry_engine import RetryEngine

__all__ = [
    "TelemetryParser",
    "UploadQueue",
    "RetryEngine",
]


def __getattr__(name):
    # Keep optional HTTP uploader dependencies out of core commands such as
    # validate, doctor, and mock runs.
    if name in {"TelemetryUploader", "auto_upload_run"}:
        from gli_flow.telemetry.uploader import TelemetryUploader, auto_upload_run
        return {"TelemetryUploader": TelemetryUploader, "auto_upload_run": auto_upload_run}[name]
    if name == "FailureAtlasUploader":
        from gli_flow.telemetry.failure_atlas_uploader import FailureAtlasUploader
        return FailureAtlasUploader
    raise AttributeError(name)
