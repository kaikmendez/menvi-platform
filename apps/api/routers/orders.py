import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..deps import get_current_user
from ..models import Customer, Order, OrderItem, OrderItemOption, OrderStatus, Product, ProductOption, Restaurant
from ..schemas import CreateOrderIn, OrderOut, UpdateOrderStatusIn

router = APIRouter(tags=['orders'])


def _build_order_payload(order: Order) -> dict:
    items = []
    for item in order.items:
        option_names = [link.product_option.name for link in item.options if link.product_option]
        line_total = float(item.unit_price) * item.quantity
        items.append(
            {
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product.name if item.product else 'Produto removido',
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'line_total': line_total,
                'option_names': option_names,
                'note': item.note,
            }
        )

    return {
        'id': order.id,
        'code': order.id[:8],
        'restaurant_id': order.restaurant_id,
        'customer_id': order.customer_id,
        'customer_name': order.customer.name if order.customer else 'Cliente',
        'customer_phone': order.customer.phone if order.customer else '-',
        'status': order.status.value,
        'total_amount': float(order.total_amount),
        'notes': order.notes,
        'created_at': order.created_at,
        'items': items,
    }


@router.post('/public/orders', response_model=OrderOut)
def create_order(payload: CreateOrderIn, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.slug == payload.restaurant_slug).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail='Restaurante não encontrado')

    customer = (
        db.query(Customer)
        .filter(and_(Customer.restaurant_id == restaurant.id, Customer.phone == payload.customer.phone))
        .first()
    )
    if customer:
        customer.name = payload.customer.name
    else:
        customer = Customer(
            id=str(uuid.uuid4()),
            restaurant_id=restaurant.id,
            name=payload.customer.name,
            phone=payload.customer.phone,
        )
        db.add(customer)

    total_amount = 0.0
    created_items: list[OrderItem] = []

    for input_item in payload.items:
        product = (
            db.query(Product)
            .filter(
                and_(
                    Product.id == input_item.product_id,
                    Product.restaurant_id == restaurant.id,
                    Product.is_active.is_(True),
                )
            )
            .first()
        )
        if not product:
            raise HTTPException(status_code=400, detail=f'Produto inválido: {input_item.product_id}')

        product_options = (
            db.query(ProductOption)
            .filter(
                and_(
                    ProductOption.product_id == product.id,
                    ProductOption.id.in_(input_item.option_ids if input_item.option_ids else ['-']),
                )
            )
            .all()
            if input_item.option_ids
            else []
        )

        selected_ids = {opt.id for opt in product_options}
        invalid = [option_id for option_id in input_item.option_ids if option_id not in selected_ids]
        if invalid:
            raise HTTPException(status_code=400, detail=f'Opções inválidas para o produto {product.name}')

        required_options = [opt.id for opt in product.options if opt.is_required]
        missing_required = [opt for opt in required_options if opt not in selected_ids]
        if missing_required:
            raise HTTPException(status_code=400, detail=f'Opções obrigatórias ausentes para {product.name}')

        unit_price = float(product.price) + sum(float(opt.price_impact) for opt in product_options)
        total_amount += unit_price * input_item.quantity

        created_items.append(
            OrderItem(
                id=str(uuid.uuid4()),
                order_id='',
                product_id=product.id,
                quantity=input_item.quantity,
                unit_price=unit_price,
                note=input_item.note,
            )
        )

    order = Order(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        customer_id=customer.id,
        status=OrderStatus.PENDING,
        total_amount=round(total_amount, 2),
        notes=payload.notes,
    )
    db.add(order)

    for item, input_item in zip(created_items, payload.items):
        item.order_id = order.id
        db.add(item)
        if input_item.option_ids:
            options = (
                db.query(ProductOption)
                .filter(ProductOption.id.in_(input_item.option_ids))
                .all()
            )
            for option in options:
                db.add(
                    OrderItemOption(
                        id=str(uuid.uuid4()),
                        order_item_id=item.id,
                        product_option_id=option.id,
                    )
                )

    db.commit()

    order_db = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.options).joinedload(OrderItemOption.product_option),
        )
        .filter(Order.id == order.id)
        .first()
    )

    return _build_order_payload(order_db)


@router.get('/orders')
def list_orders(status: str | None = None, _: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    restaurant_id = _.get('restaurant_id')

    query = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.options).joinedload(OrderItemOption.product_option),
        )
        .filter(Order.restaurant_id == restaurant_id)
    )
    if status:
        try:
            query = query.filter(Order.status == OrderStatus(status.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail='Status inválido')

    orders = query.order_by(Order.created_at.desc()).all()
    return {'data': [_build_order_payload(order) for order in orders]}


@router.get('/orders/{order_id}', response_model=OrderOut)
def get_order(order_id: str, _: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    restaurant_id = _.get('restaurant_id')
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.items).joinedload(OrderItem.options).joinedload(OrderItemOption.product_option),
        )
        .filter(and_(Order.id == order_id, Order.restaurant_id == restaurant_id))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')

    return _build_order_payload(order)


@router.patch('/orders/{order_id}/status')
def update_status(order_id: str, payload: UpdateOrderStatusIn, _: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    restaurant_id = _.get('restaurant_id')

    status_value = payload.status.upper()
    try:
        new_status = OrderStatus(status_value)
    except ValueError:
        raise HTTPException(status_code=400, detail='Status inválido')

    order = db.query(Order).filter(and_(Order.id == order_id, Order.restaurant_id == restaurant_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')

    order.status = new_status
    db.commit()
    db.refresh(order)
    return {'id': order.id, 'status': order.status.value}
