from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.config import settings
from ...core.db import get_db
from ..orders import service as order_service
from . import service
from .schemas import PushSubscriptionIn, PushSubscriptionOut, VapidPublicKeyOut

router = APIRouter(prefix='/public', tags=['push'])


@router.get('/push/vapid-public-key', response_model=VapidPublicKeyOut)
def get_vapid_public_key() -> VapidPublicKeyOut:
    return VapidPublicKeyOut(public_key=settings.vapid_public_key or None)


@router.post(
    '/orders/{order_id}/push/subscribe',
    response_model=PushSubscriptionOut,
    status_code=201,
)
def subscribe(
    order_id: str,
    payload: PushSubscriptionIn,
    db: Session = Depends(get_db),
) -> PushSubscriptionOut:
    order = order_service.get_order_public(db, order_id)
    service.register(
        db,
        order_id=order.id,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
    )
    return PushSubscriptionOut(ok=True)
