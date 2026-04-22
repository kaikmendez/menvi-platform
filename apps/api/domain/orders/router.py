from __future__ import annotations

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from ...core.config import settings as app_settings
from ...core.db import get_db
from ...core.deps import CurrentUser, get_current_user
from ...core.errors import Unauthorized
from ...core.realtime import hub
from ...core.security import decode_token
from ..push import service as push_service
from . import service
from .models import OrderStatus
from .schemas import OrderOut, OrderStatusUpdateIn

_STATUS_MESSAGES: dict[OrderStatus, str] = {
    OrderStatus.CONFIRMED: 'Pedido confirmado pelo restaurante.',
    OrderStatus.PREPARING: 'Seu pedido está sendo preparado.',
    OrderStatus.READY: 'Seu pedido está pronto!',
    OrderStatus.DELIVERED: 'Pedido entregue. Bom apetite!',
    OrderStatus.CANCELLED: 'Seu pedido foi cancelado.',
}

router = APIRouter(prefix='/crm/orders', tags=['orders'])


@router.get('', response_model=list[OrderOut])
def list_orders(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: OrderStatus | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[OrderOut]:
    orders = service.list_orders(db, current_user.restaurant_id, status=status, limit=limit)
    return [OrderOut.model_validate(o) for o in orders]


@router.get('/{order_id}', response_model=OrderOut)
def get_order(
    order_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderOut:
    order = service.get_order_for_restaurant(db, current_user.restaurant_id, order_id)
    return OrderOut.model_validate(order)


@router.post('/{order_id}/status', response_model=OrderOut)
def update_status(
    order_id: str,
    payload: OrderStatusUpdateIn,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderOut:
    order = service.change_status(
        db,
        restaurant_id=current_user.restaurant_id,
        order_id=order_id,
        to_status=payload.status,
        actor_user_id=current_user.id,
        note=payload.note,
    )
    out = OrderOut.model_validate(order)
    hub.publish_sync(current_user.restaurant_id, 'order.status_changed', out.model_dump(mode='json'))

    message = _STATUS_MESSAGES.get(order.status)
    if message:
        push_service.send_to_order(
            db,
            order,
            title=f'Pedido #{order.code}',
            body=message,
            url=f'{app_settings.menu_web_url.rstrip("/")}/r/{order.restaurant.slug}/pedido/{order.id}',
        )
    return out


@router.websocket('/ws')
async def orders_ws(websocket: WebSocket) -> None:
    """Canal realtime do CRM. Autenticação por query param `?token=<access_token>`."""
    await websocket.accept()
    token = websocket.query_params.get('token', '')
    try:
        payload = decode_token(token)
    except ValueError:
        await websocket.close(code=4401)
        return
    restaurant_id = payload.get('restaurant_id')
    if not restaurant_id or payload.get('typ') != 'access':
        await websocket.close(code=4401)
        return

    await hub.subscribe(restaurant_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keepalive / ignorado
    except WebSocketDisconnect:
        pass
    except Unauthorized:
        pass
    finally:
        await hub.unsubscribe(restaurant_id, websocket)
