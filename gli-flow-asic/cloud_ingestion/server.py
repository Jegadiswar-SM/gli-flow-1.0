import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from cloud_ingestion.config import CloudIngestionConfig
from cloud_ingestion.database import IngestionDatabase
from cloud_ingestion.models import (
    UploadPayload,
    UploadResponse,
    HealthResponse,
    StatsResponse,
)

logger = logging.getLogger(__name__)

_start_time = time.time()


class CloudIngestionServer:
    def __init__(self, config: Optional[CloudIngestionConfig] = None):
        self.config = config or CloudIngestionConfig.load()
        self.db = IngestionDatabase(self.config)
        self.db.initialize()

    def verify_api_key(self, request: Request):
        if not self.config.auth.enabled:
            return True
        api_key = request.headers.get("X-API-Key", "")
        if api_key != self.config.auth.api_key:
            raise HTTPException(status_code=401, detail="Invalid API key")
        return True

    def create_app(self) -> FastAPI:
        app = FastAPI(
            title="GLI Flow Cloud Ingestion",
            version="1.0.0",
            description="Privacy-safe telemetry and failure atlas ingestion endpoint",
        )

        app.add_middleware(
            CORSMiddleware,
            allow_origins=self.config.cors.allowed_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @app.post("/api/v1/telemetry", response_model=UploadResponse)
        async def ingest_telemetry(
            payload: UploadPayload,
            request: Request,
            _=Depends(self.verify_api_key),
        ):
            batch_id = str(uuid.uuid4())
            source_ip = request.client.host if request.client else ""

            telemetry_count = 0
            failures_count = 0
            escalations_count = 0

            try:
                if payload.telemetry_events:
                    events_dict = [e.model_dump() for e in payload.telemetry_events]
                    telemetry_count = self.db.insert_telemetry_events(
                        events_dict, batch_id, source_ip
                    )

                if payload.failure_atlas_entries:
                    entries_dict = [e.model_dump() for e in payload.failure_atlas_entries]
                    failures_count = self.db.insert_failure_entries(
                        entries_dict, batch_id
                    )

                escalations_count = len(payload.escalations)
                for esc in payload.escalations:
                    self.db.record_consent(
                        esc.run_id,
                        esc.consent_record.get("consent_given", False),
                        esc.consent_record.get("consent_timestamp", ""),
                    )

                self.db.record_upload_audit(
                    run_id=payload.run_id,
                    batch_id=batch_id,
                    telemetry_count=telemetry_count,
                    failures_count=failures_count,
                    escalations_count=escalations_count,
                    source_version=payload.source_version,
                    client_ip=source_ip,
                    status="accepted",
                )

                logger.info(
                    "Ingested run=%s batch=%s telemetry=%d failures=%d escalations=%d",
                    payload.run_id, batch_id, telemetry_count, failures_count, escalations_count,
                )

                return UploadResponse(
                    status="accepted",
                    run_id=payload.run_id,
                    telemetry_accepted=telemetry_count,
                    failures_accepted=failures_count,
                    escalations_accepted=escalations_count,
                    upload_id=batch_id,
                )

            except Exception as e:
                logger.error("Ingestion failed for run=%s: %s", payload.run_id, e)
                self.db.record_upload_audit(
                    run_id=payload.run_id,
                    batch_id=batch_id,
                    telemetry_count=telemetry_count,
                    failures_count=failures_count,
                    escalations_count=escalations_count,
                    source_version=payload.source_version,
                    client_ip=source_ip,
                    status="failed",
                    error_message=str(e),
                )
                raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

        @app.get("/api/v1/health", response_model=HealthResponse)
        async def health():
            return HealthResponse(
                status="ok",
                database="connected",
                uptime_sec=time.time() - _start_time,
            )

        @app.get("/api/v1/stats", response_model=StatsResponse)
        async def stats(_=Depends(self.verify_api_key)):
            db_stats = self.db.get_stats()
            return StatsResponse(**db_stats)

        return app


def create_app(config: Optional[CloudIngestionConfig] = None) -> FastAPI:
    server = CloudIngestionServer(config)
    return server.create_app()


if __name__ == "__main__":
    import uvicorn
    cfg = CloudIngestionConfig.load()
    uvicorn.run(
        "cloud_ingestion.server:create_app",
        host=cfg.server.host,
        port=cfg.server.port,
        log_level=cfg.server.log_level.lower(),
        workers=cfg.server.workers,
    )
