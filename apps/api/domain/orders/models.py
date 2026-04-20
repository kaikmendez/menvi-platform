from __future__ import annotations

import enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin

if TYPE_CHECKING:
    from ..customers.models import Customer
    from ..restaurants.models import Restaurant


class OrderStatus(str, enum.Enum):
    PENDING = 'PENDING'
    CONFIRMED = 'CONFIRMED'
    PREPARING = 'PREPARING'
    READY = 'READY'
    DELIVERED = 'DELIVERED'
    CANCELLED = 'CANCELLED'


class PaymentMethod(str, enum.Enum):
    PIX = 'PIX'
    CARD = 'CARD'
    CASH = 'CASH'


class Order(Base, TimestampMixin):
    __tablename__ = 'orders'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str] = mapped_column(String(26), ForeignKey('restaurants.id', ondelete='CASCADE'), index=True)
    customer_id: Mapped[str] = mapped_column(String(26), ForeignKey('customers.id', ondelete='RESTRICT'), index=True)
    code: Mapped[int] = mapped_column(Integer)  # sequencial humano por restaurante (#1042)
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, name='order_status'), default=OrderStatus.PENDING, index=True
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod, name='payment_method'))

    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal('0'))
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    restaurant: Mapped[Restaurant] = relationship(back_populates='orders')
    customer: Mapped[Customer] = relationship(back_populates='orders')
    items: Mapped[list[OrderItem]] = relationship(back_populates='order', cascade='all, delete-orphan')
    events: Mapped[list[OrderEvent]] = relationship(
        back_populates='order', cascade='all, delete-orphan', order_by='OrderEvent.created_at'
    )


class OrderItem(Base, TimestampMixin):
    __tablename__ = 'order_items'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(String(26), ForeignKey('orders.id', ondelete='CASCADE'), index=True)
    product_id: Mapped[str] = mapped_column(String(26), ForeignKey('products.id', ondelete='RESTRICT'))
    product_name: Mapped[str] = mapped_column(String(160))  # snapshot
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    quantity: Mapped[int] = mapped_column(Integer)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped[Order] = relationship(back_populates='items')
    options: Mapped[list[OrderItemOption]] = relationship(back_populates='order_item', cascade='all, delete-orphan')


class OrderItemOption(Base):
    __tablename__ = 'order_item_options'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    order_item_id: Mapped[str] = mapped_column(String(26), ForeignKey('order_items.id', ondelete='CASCADE'), index=True)
    product_option_id: Mapped[str] = mapped_column(String(26), ForeignKey('product_options.id', ondelete='RESTRICT'))
    name: Mapped[str] = mapped_column(String(120))  # snapshot
    price_delta: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order_item: Mapped[OrderItem] = relationship(back_populates='options')


class OrderEvent(Base, TimestampMixin):
    """Auditoria de mudanças de status de um pedido."""

    __tablename__ = 'order_events'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(String(26), ForeignKey('orders.id', ondelete='CASCADE'), index=True)
    from_status: Mapped[OrderStatus | None] = mapped_column(SAEnum(OrderStatus, name='order_status'), nullable=True)
    to_status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus, name='order_status'))
    actor_user_id: Mapped[str | None] = mapped_column(String(26), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped[Order] = relationship(back_populates='events')
