import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Optional

from cloud_ingestion.config import CloudIngestionConfig


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS telemetry_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    tool TEXT NOT NULL,
    stage TEXT NOT NULL,
    event TEXT NOT NULL,
    design_name TEXT,
    metrics TEXT DEFAULT '{}',
    details TEXT,
    recorded_at TEXT NOT NULL,
    ingested_at TEXT NOT NULL,
    source_ip TEXT,
    upload_batch_id TEXT
);

CREATE TABLE IF NOT EXISTS failure_atlas_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    tool TEXT NOT NULL,
    stage TEXT NOT NULL,
    failure_type TEXT NOT NULL,
    error_text TEXT,
    design_name TEXT,
    design_category TEXT,
    log_excerpt TEXT,
    frequency INTEGER DEFAULT 1,
    first_seen TEXT,
    last_seen TEXT,
    ingested_at TEXT NOT NULL,
    upload_batch_id TEXT
);

CREATE TABLE IF NOT EXISTS upload_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    telemetry_count INTEGER DEFAULT 0,
    failures_count INTEGER DEFAULT 0,
    escalations_count INTEGER DEFAULT 0,
    source_version TEXT,
    client_ip TEXT,
    status TEXT NOT NULL DEFAULT 'accepted',
    error_message TEXT,
    ingested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consent_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    consent_given INTEGER NOT NULL DEFAULT 0,
    consent_timestamp TEXT,
    recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_te_run_id ON telemetry_events(run_id);
CREATE INDEX IF NOT EXISTS idx_te_event ON telemetry_events(event);
CREATE INDEX IF NOT EXISTS idx_te_recorded ON telemetry_events(recorded_at);
CREATE INDEX IF NOT EXISTS idx_fae_run_id ON failure_atlas_events(run_id);
CREATE INDEX IF NOT EXISTS idx_fae_failure_type ON failure_atlas_events(failure_type);
CREATE INDEX IF NOT EXISTS idx_fae_design_name ON failure_atlas_events(design_name);
CREATE INDEX IF NOT EXISTS idx_ua_run_id ON upload_audit(run_id);
CREATE INDEX IF NOT EXISTS idx_ua_status ON upload_audit(status);
CREATE INDEX IF NOT EXISTS idx_cr_run_id ON consent_records(run_id);
"""


class IngestionDatabase:
    def __init__(self, config: CloudIngestionConfig):
        self.config = config

    @property
    def _db_path(self) -> str:
        url = self.config.database.url
        if url.startswith("sqlite:///"):
            path = url[len("sqlite:///"):]
            os.makedirs(os.path.dirname(path), exist_ok=True)
            return path
        return "/tmp/cloud_ingestion_dev.db"

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        return conn

    def initialize(self):
        conn = self._get_connection()
        try:
            conn.executescript(SCHEMA_SQL)
            conn.commit()
        finally:
            conn.close()

    def insert_telemetry_events(self, events: list[dict], batch_id: str, source_ip: str = "") -> int:
        conn = self._get_connection()
        try:
            now = datetime.now(timezone.utc).isoformat()
            count = 0
            for ev in events:
                conn.execute(
                    """INSERT INTO telemetry_events
                       (run_id, tool, stage, event, design_name, metrics, details, recorded_at, ingested_at, source_ip, upload_batch_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        ev.get("run_id") or "",
                        ev.get("tool") or "",
                        ev.get("stage") or "",
                        ev.get("event") or "",
                        ev.get("design_name"),
                        json.dumps(ev.get("metrics", {}), default=str),
                        json.dumps(ev.get("details"), default=str),
                        ev.get("recorded_at") or now,
                        now,
                        source_ip,
                        batch_id,
                    ),
                )
                count += 1
            conn.commit()
            return count
        finally:
            conn.close()

    def insert_failure_entries(self, entries: list[dict], batch_id: str) -> int:
        conn = self._get_connection()
        try:
            now = datetime.now(timezone.utc).isoformat()
            count = 0
            for entry in entries:
                conn.execute(
                    """INSERT INTO failure_atlas_events
                       (run_id, tool, stage, failure_type, error_text, design_name, design_category,
                        log_excerpt, frequency, first_seen, last_seen, ingested_at, upload_batch_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        entry.get("run_id") or "",
                        entry.get("tool") or "",
                        entry.get("stage") or "",
                        entry.get("failure_type") or "",
                        entry.get("error_text"),
                        entry.get("design_name"),
                        entry.get("design_category"),
                        entry.get("log_excerpt"),
                        entry.get("frequency") or 1,
                        entry.get("first_seen"),
                        entry.get("last_seen"),
                        now,
                        batch_id,
                    ),
                )
                count += 1
            conn.commit()
            return count
        finally:
            conn.close()

    def record_upload_audit(self, run_id: str, batch_id: str,
                            telemetry_count: int, failures_count: int,
                            escalations_count: int, source_version: str = "",
                            client_ip: str = "", status: str = "accepted",
                            error_message: str = "") -> int:
        conn = self._get_connection()
        try:
            now = datetime.now(timezone.utc).isoformat()
            cur = conn.execute(
                """INSERT INTO upload_audit
                   (run_id, batch_id, telemetry_count, failures_count, escalations_count,
                    source_version, client_ip, status, error_message, ingested_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (run_id, batch_id, telemetry_count, failures_count, escalations_count,
                 source_version, client_ip, status, error_message, now),
            )
            conn.commit()
            return cur.lastrowid or 0
        finally:
            conn.close()

    def record_consent(self, run_id: str, consent_given: bool, consent_timestamp: str = ""):
        conn = self._get_connection()
        try:
            now = datetime.now(timezone.utc).isoformat()
            conn.execute(
                """INSERT INTO consent_records
                   (run_id, consent_given, consent_timestamp, recorded_at)
                   VALUES (?, ?, ?, ?)""",
                (run_id, 1 if consent_given else 0, consent_timestamp, now),
            )
            conn.commit()
        finally:
            conn.close()

    def get_stats(self) -> dict:
        conn = self._get_connection()
        try:
            stats = {}
            stats["total_telemetry_events"] = conn.execute("SELECT COUNT(*) FROM telemetry_events").fetchone()[0]
            stats["total_failure_atlas_entries"] = conn.execute("SELECT COUNT(*) FROM failure_atlas_events").fetchone()[0]
            stats["total_uploads"] = conn.execute("SELECT COUNT(*) FROM upload_audit").fetchone()[0]
            stats["unique_runs"] = conn.execute("SELECT COUNT(DISTINCT run_id) FROM upload_audit").fetchone()[0]
            stats["unique_designs"] = conn.execute("SELECT COUNT(DISTINCT design_name) FROM failure_atlas_events").fetchone()[0]
            try:
                stats["db_size_bytes"] = os.path.getsize(self._db_path)
            except OSError:
                stats["db_size_bytes"] = 0
            return stats
        finally:
            conn.close()

    def close(self):
        pass
