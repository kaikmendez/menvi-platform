from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Order, OrderStatus

router = APIRouter(prefix='/orders', tags=['orders'])


@router.get('')
def list_items(status: str | None = None, _: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Order)
    if status:
        try:
            query = query.filter(Order.status == OrderStatus(status.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail='Status inválido')

    orders = query.order_by(Order.id.desc()).all()
    return {
        'module': 'orders',
        'data': [
            {
                'id': item.id,
                'customer_id': item.customer_id,
                'status': item.status.value,
                'total_amount': float(item.total_amount),
                'notes': item.notes
            }
            for item in orders
        ]
    }


@router.patch('/{order_id}/status')
def update_status(order_id: str, payload: dict, _: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    status_value = (payload.get('status') or '').upper()

    try:
        new_status = OrderStatus(status_value)
    except ValueError:
        raise HTTPException(status_code=400, detail='Status inválido')

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')

    order.status = new_status
    db.commit()
    db.refresh(order)
    return {'id': order.id, 'status': order.status.value}
