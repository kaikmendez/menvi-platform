from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..deps import get_current_user
from ..models import Customer, Order, OrderItem, OrderItemOption

router = APIRouter(prefix='/customers', tags=['customers'])


@router.get('')
def list_items(_: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    restaurant_id = _.get('restaurant_id')

    customers = (
        db.query(Customer)
        .options(joinedload(Customer.orders))
        .filter(Customer.restaurant_id == restaurant_id)
        .all()
    )

    data = []
    for customer in customers:
        orders = sorted(customer.orders, key=lambda order: order.created_at or 0, reverse=True)
        orders_count = len(orders)
        total_spent = round(sum(float(order.total_amount) for order in orders), 2)
        avg_ticket = round(total_spent / orders_count, 2) if orders_count else 0
        last_order = orders[0].created_at if orders else None

        data.append(
            {
                'id': customer.id,
                'name': customer.name,
                'phone': customer.phone,
                'orders_count': orders_count,
                'last_order_at': last_order,
                'total_spent': total_spent,
                'avg_ticket': avg_ticket,
            }
        )

    data.sort(key=lambda item: item['orders_count'], reverse=True)
    return {'data': data}


@router.get('/{customer_id}/orders')
def customer_orders(customer_id: str, _: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    restaurant_id = _.get('restaurant_id')

    customer = (
        db.query(Customer)
        .filter(and_(Customer.id == customer_id, Customer.restaurant_id == restaurant_id))
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail='Cliente não encontrado')

    orders = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.options).joinedload(OrderItemOption.product_option),
        )
        .filter(and_(Order.customer_id == customer_id, Order.restaurant_id == restaurant_id))
        .order_by(Order.created_at.desc())
        .all()
    )

    return {
        'customer': {'id': customer.id, 'name': customer.name, 'phone': customer.phone},
        'orders': [
            {
                'id': order.id,
                'code': order.id[:8],
                'status': order.status.value,
                'total_amount': float(order.total_amount),
                'created_at': order.created_at,
                'items_count': len(order.items),
            }
            for order in orders
        ],
    }
