from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin

if TYPE_CHECKING:
    from ..menu.models import Category, Product
    from ..orders.models import Order
    from ..users.models import User


class Restaurant(Base, TimestampMixin):
    __tablename__ = 'restaurants'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    whatsapp_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True)

    settings: Mapped[RestaurantSettings] = relationship(
        back_populates='restaurant',
        uselist=False,
        cascade='all, delete-orphan',
    )
    users: Mapped[list[User]] = relationship(back_populates='restaurant', cascade='all, delete-orphan')
    categories: Mapped[list[Category]] = relationship(back_populates='restaurant', cascade='all, delete-orphan')
    products: Mapped[list[Product]] = relationship(back_populates='restaurant', cascade='all, delete-orphan')
    orders: Mapped[list[Order]] = relationship(back_populates='restaurant', cascade='all, delete-orphan')


class RestaurantSettings(Base, TimestampMixin):
    __tablename__ = 'restaurant_settings'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str] = mapped_column(
        String(26),
        ForeignKey('restaurants.id', ondelete='CASCADE'),
        unique=True,
        index=True,
    )
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal('0'))
    min_order_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal('0'))
    accepts_pix: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_card: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_cash: Mapped[bool] = mapped_column(Boolean, default=True)
    opening_hours: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON serializado; mantemos flexível

    restaurant: Mapped[Restaurant] = relationship(back_populates='settings')
