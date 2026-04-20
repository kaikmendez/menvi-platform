from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin

if TYPE_CHECKING:
    from ..orders.models import Order


class Customer(Base, TimestampMixin):
    """Cliente final do restaurante (quem pede pelo cardápio)."""

    __tablename__ = 'customers'
    __table_args__ = (UniqueConstraint('restaurant_id', 'phone', name='uq_customer_restaurant_phone'),)

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str] = mapped_column(String(26), ForeignKey('restaurants.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(160))
    phone: Mapped[str] = mapped_column(String(32), index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    orders: Mapped[list[Order]] = relationship(back_populates='customer')
