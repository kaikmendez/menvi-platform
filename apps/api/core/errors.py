from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Erro de regra de negócio traduzido em HTTP pela API."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = 'domain_error'

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None) -> None:
        super().__init__(message)
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class NotFound(DomainError):
    status_code = status.HTTP_404_NOT_FOUND
    code = 'not_found'


class Unauthorized(DomainError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = 'unauthorized'


class Forbidden(DomainError):
    status_code = status.HTTP_403_FORBIDDEN
    code = 'forbidden'


class Conflict(DomainError):
    status_code = status.HTTP_409_CONFLICT
    code = 'conflict'


class ValidationFailed(DomainError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = 'validation_failed'


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={'detail': str(exc), 'code': exc.code},
        )
