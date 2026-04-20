from __future__ import annotations

import enum
from decimal import Decimal

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin


class PaymentStatus(str, enum.Enum):
    PENDING = 'PENDING'
    PAID = 'PAID'
    FAILED = 'FAILED'
    REFUNDED = 'REFUNDED'


class Payment(Base, TimestampMixin):
    __tablename__ = 'payments'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(String(26), ForeignKey('orders.id', ondelete='CASCADE'), index=True)
    restaurant_id: Mapped[str] = mapped_column(String(26), ForeignKey('restaurants.id', ondelete='CASCADE'), index=True)
    provider: Mapped[str] = mapped_column(String(40), default='mock')  # 'mock' | 'mercadopago' | 'pagarme'
    provider_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name='payment_status'), default=PaymentStatus.PENDING
    )
    qr_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_response: Mapped[str | None] = mapped_column(Text, nullable=True)
