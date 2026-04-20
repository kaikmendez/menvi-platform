import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from jose import jwt

from .config import settings

PBKDF2_PREFIX = 'pbkdf2_sha256'
PBKDF2_ITERATIONS = 390000


def _pbkdf2_hash(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), PBKDF2_ITERATIONS)
    return digest.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith(f'{PBKDF2_PREFIX}$'):
        try:
            _, iterations, salt, expected = hashed_password.split('$', 3)
            computed = hashlib.pbkdf2_hmac(
                'sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), int(iterations)
            ).hex()
            return secrets.compare_digest(computed, expected)
        except Exception:
            return False

    # Fallback para hashes legados (bcrypt/passlib). Evita crash em ambientes com incompatibilidade de versões.
    try:
        from passlib.context import CryptContext

        legacy_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
        return legacy_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = _pbkdf2_hash(password, salt)
    return f'{PBKDF2_PREFIX}${PBKDF2_ITERATIONS}${salt}${digest}'


def create_access_token(subject: str, extra: dict | None = None) -> str:
    payload = {'sub': subject, 'exp': datetime.now(UTC) + timedelta(minutes=settings.jwt_expires_minutes)}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
