from __future__ import annotations

from ulid import ULID


def new_id() -> str:
    """Gera um ULID (26 chars, ordenável por tempo). Usado como PK em todos os modelos."""
    return str(ULID())
