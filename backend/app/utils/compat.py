"""Dialect-aware type helpers — PostgreSQL native types or SQLite fallbacks."""

import json
import uuid

from sqlalchemy import String, Text, TypeDecorator


class GUID(TypeDecorator):
    """UUID type: native UUID on PostgreSQL, String(36) on SQLite."""
    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(value)
        # SQLite: store as string
        return str(value) if isinstance(value, uuid.UUID) else str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


class JSONType(TypeDecorator):
    """JSON type: native JSONB on PostgreSQL, Text+json on SQLite."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import JSONB
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value  # asyncpg handles dict → JSONB natively
        return json.dumps(value, ensure_ascii=False)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, dict):
            return value  # Already deserialized by asyncpg
        if isinstance(value, str):
            return json.loads(value)
        return value
