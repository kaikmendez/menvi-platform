from __future__ import annotations

from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from ...core.errors import Conflict, NotFound, ValidationFailed
from ..customers.service import get_or_create_by_phone
from ..menu.models import Product, ProductOption
from ..restaurants.service import get_settings as get_restaurant_settings
from .models import Order, OrderEvent, OrderItem, OrderItemOption, OrderStatus, PaymentMethod

# Transições válidas de status (máquina de estados)
_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.READY, OrderStatus.CANCELLED},
    OrderStatus.READY: {OrderStatus.DELIVERED, OrderStatus.CANCELLED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


def _next_order_code(db: Session, restaurant_id: str) -> int:
    current = db.query(func.max(Order.code)).filter(Order.restaurant_id == restaurant_id).scalar()
    return (current or 0) + 1


def _validate_payment_method(method: PaymentMethod, settings) -> None:  # type: ignore[no-untyped-def]
    if method == PaymentMethod.PIX and not settings.accepts_pix:
        raise ValidationFailed('Restaurante não aceita Pix')
    if method == PaymentMethod.CARD and not settings.accepts_card:
        raise ValidationFailed('Restaurante não aceita cartão')
    if method == PaymentMethod.CASH and not settings.accepts_cash:
        raise ValidationFailed('Restaurante não aceita dinheiro')


def create_order(
    db: Session,
    *,
    restaurant_id: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str | None,
    customer_address: str | None,
    payment_method: PaymentMethod,
    notes: str | None,
    items_in: list,
) -> Order:
    if not items_in:
        raise ValidationFailed('Pedido sem itens')

    settings = get_restaurant_settings(db, restaurant_id)
    _validate_payment_method(payment_method, settings)

    # Resolve cliente (get-or-create por telefone dentro do restaurante)
    customer = get_or_create_by_phone(
        db,
        restaurant_id=restaurant_id,
        name=customer_name,
        phone=customer_phone,
        email=customer_email,
        address=customer_address,
    )

    # Carrega produtos e opções envolvidos numa query só, validando escopo do restaurante
    product_ids = [i.product_id for i in items_in]
    products: dict[str, Product] = {
        p.id: p
        for p in db.query(Product)
        .options(selectinload(Product.options))
        .filter(Product.id.in_(product_ids), Product.restaurant_id == restaurant_id)
        .all()
    }
    missing = [pid for pid in product_ids if pid not in products]
    if missing:
        raise NotFound(f'Produto inexistente: {missing[0]}')

    order_items: list[OrderItem] = []
    subtotal = Decimal('0')

    for item_in in items_in:
        product = products[item_in.product_id]
        if not product.is_available:
            raise ValidationFailed(f'Produto indisponível: {product.name}')

        allowed_option_ids = {o.id for o in product.options if o.is_available}
        selected_ids = list(item_in.option_ids or [])
        if any(oid not in allowed_option_ids for oid in selected_ids):
            raise ValidationFailed('Adicional inválido para este produto')

        options_price = Decimal('0')
        item_option_rows: list[OrderItemOption] = []
        for opt_id in selected_ids:
            option: ProductOption = next(o for o in product.options if o.id == opt_id)
            options_price += option.price_delta
            item_option_rows.append(
                OrderItemOption(
                    product_option_id=option.id,
                    name=option.name,
                    price_delta=option.price_delta,
                )
            )

        unit_price = product.price + options_price
        line_total = unit_price * item_in.quantity
        subtotal += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price=unit_price,
                quantity=item_in.quantity,
                total=line_total,
                notes=item_in.notes,
                options=item_option_rows,
            )
        )

    if subtotal < settings.min_order_amount:
        raise ValidationFailed(f'Pedido mínimo é R$ {settings.min_order_amount}. Seu subtotal ficou em R$ {subtotal}.')

    delivery_fee: Decimal = settings.delivery_fee
    total = subtotal + delivery_fee

    order = Order(
        restaurant_id=restaurant_id,
        customer_id=customer.id,
        code=_next_order_code(db, restaurant_id),
        status=OrderStatus.PENDING,
        payment_method=payment_method,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        notes=notes,
        items=order_items,
    )
    order.events = [OrderEvent(from_status=None, to_status=OrderStatus.PENDING, note='Pedido criado')]
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def _load_order(db: Session, order_id: str) -> Order:
    order = (
        db.query(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.options),
            selectinload(Order.events),
            selectinload(Order.customer),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if order is None:
        raise NotFound('Pedido não encontrado')
    return order


def list_orders(
    db: Session,
    restaurant_id: str,
    *,
    status: OrderStatus | None = None,
    limit: int = 100,
) -> list[Order]:
    q = (
        db.query(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.options),
            selectinload(Order.events),
            selectinload(Order.customer),
        )
        .filter(Order.restaurant_id == restaurant_id)
    )
    if status is not None:
        q = q.filter(Order.status == status)
    return q.order_by(Order.created_at.desc()).limit(limit).all()


def get_order_for_restaurant(db: Session, restaurant_id: str, order_id: str) -> Order:
    order = _load_order(db, order_id)
    if order.restaurant_id != restaurant_id:
        raise NotFound('Pedido não encontrado')
    return order


def get_order_public(db: Session, order_id: str) -> Order:
    """Leitura pública do pedido (para página de acompanhamento do cliente final).
    O ID é um ULID não-trivial de adivinhar — suficiente para MVP.
    """
    return _load_order(db, order_id)


def change_status(
    db: Session,
    *,
    restaurant_id: str,
    order_id: str,
    to_status: OrderStatus,
    actor_user_id: str,
    note: str | None = None,
) -> Order:
    order = get_order_for_restaurant(db, restaurant_id, order_id)
    if to_status == order.status:
        return order
    allowed = _TRANSITIONS.get(order.status, set())
    if to_status not in allowed:
        raise Conflict(f'Transição inválida: {order.status.value} → {to_status.value}')
    event = OrderEvent(
        from_status=order.status,
        to_status=to_status,
        actor_user_id=actor_user_id,
        note=note,
    )
    order.status = to_status
    order.events.append(event)
    db.commit()
    db.refresh(order)
    return order
