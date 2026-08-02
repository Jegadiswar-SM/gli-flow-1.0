import os
from typing import Optional

from gli_flow.database.database_provider import DatabaseProvider


def create_provider(database_url: Optional[str] = None, db_path: Optional[str] = None) -> DatabaseProvider:
    url = database_url or os.environ.get("DATABASE_URL")
    if url and url.startswith("postgresql"):
        from gli_flow.database.postgres_provider import PostgresProvider
        provider = PostgresProvider(database_url=url)
        provider.connect()
        return provider

    from gli_flow.database.sqlite_provider import SQLiteProvider
    provider = SQLiteProvider(db_path=db_path)
    provider.connect()
    return provider
