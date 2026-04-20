from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.db import get_db
from . import service
from .schemas import AccessTokenOut, LoginIn, RefreshIn, TokenPair

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/login', response_model=TokenPair)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenPair:
    return service.authenticate(db, email=payload.email, password=payload.password)


@router.post('/refresh', response_model=AccessTokenOut)
def refresh(payload: RefreshIn, db: Session = Depends(get_db)) -> AccessTokenOut:
    return service.refresh_access(db, refresh_token=payload.refresh_token)
