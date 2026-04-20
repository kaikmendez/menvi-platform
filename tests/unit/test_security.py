from __future__ import annotations

from apps.api.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    h = hash_password('hunter2')
    assert verify_password('hunter2', h)
    assert not verify_password('nope', h)


def test_access_token_roundtrip() -> None:
    token = create_access_token('user-123', {'role': 'OWNER'})
    payload = decode_token(token)
    assert payload['sub'] == 'user-123'
    assert payload['typ'] == 'access'
    assert payload['role'] == 'OWNER'


def test_refresh_token_has_type() -> None:
    token = create_refresh_token('user-123')
    payload = decode_token(token)
    assert payload['typ'] == 'refresh'
