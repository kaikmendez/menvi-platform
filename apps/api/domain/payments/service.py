from __future__ import annotations

from sqlalchemy.orm import Session

from ..orders.models import Order, PaymentMethod
from .gateway import get_gateway
from .models import Payment, PaymentStatus


def create_pending_payment_for_order(db: Session, order: Order) -> Payment:
    """Cria `Payment` pendente para o pedido, usando o gateway configurado.
    Para PIX gera QR code. Para CARD / CASH só registra a intenção — MVP.
    """
    gateway = get_gateway()
    provider = gateway.name
    provider_id: str | None = None
    qr_code: str | None = None
    raw: str | None = None

    if order.payment_method == PaymentMethod.PIX:
        intent = gateway.create_pix_intent(
            order_id=order.id,
            amount=order.total,
            customer_name=order.customer.name,
        )
        provider_id = intent.provider_id
        qr_code = intent.qr_code
        raw = intent.raw_response

    payment = Payment(
        order_id=order.id,
        restaurant_id=order.restaurant_id,
        provider=provider,
        provider_id=provider_id,
        amount=order.total,
        status=PaymentStatus.PENDING,
        qr_code=qr_code,
        raw_response=raw,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment
