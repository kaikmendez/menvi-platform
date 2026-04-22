from __future__ import annotations

import json
import logging

import structlog
from sqlalchemy.orm import Session

from ...core.config import settings
from ..orders.models import Order
from .models import PushSubscription

log = structlog.get_logger(__name__)


def _is_configured() -> bool:
    return bool(settings.vapid_public_key and settings.vapid_private_key and settings.vapid_subject)


def register(
    db: Session,
    *,
    order_id: str,
    endpoint: str,
    p256dh: str,
    auth: str,
) -> PushSubscription:
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.order_id == order_id, PushSubscription.endpoint == endpoint)
        .first()
    )
    if existing:
        existing.p256dh = p256dh
        existing.auth = auth
        db.commit()
        return existing

    sub = PushSubscription(order_id=order_id, endpoint=endpoint, p256dh=p256dh, auth=auth)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def _send_one(sub: PushSubscription, payload: dict) -> bool:
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        log.warning('push.pywebpush_not_installed')
        return False

    try:
        webpush(
            subscription_info={
                'endpoint': sub.endpoint,
                'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
            },
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={'sub': settings.vapid_subject},
        )
        return True
    except WebPushException as exc:
        status = getattr(getattr(exc, 'response', None), 'status_code', None)
        log.info('push.delivery_failed', endpoint=sub.endpoint[:60], status=status)
        return status not in (404, 410)
    except Exception:
        logging.getLogger(__name__).exception('push.delivery_error')
        return True


def send_to_order(db: Session, order: Order, *, title: str, body: str, url: str) -> int:
    if not _is_configured():
        return 0

    subs = db.query(PushSubscription).filter(PushSubscription.order_id == order.id).all()
    if not subs:
        return 0

    payload = {'title': title, 'body': body, 'url': url}
    sent = 0
    stale: list[str] = []
    for sub in subs:
        ok = _send_one(sub, payload)
        if ok:
            sent += 1
        else:
            stale.append(sub.id)

    if stale:
        db.query(PushSubscription).filter(PushSubscription.id.in_(stale)).delete(synchronize_session=False)
        db.commit()

    return sent
