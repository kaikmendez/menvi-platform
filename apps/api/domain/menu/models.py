from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin

if TYPE_CHECKING:
    from ..restaurants.models import Restaurant


class Category(Base, TimestampMixin):
    __tablename__ = 'categories'
    __table_args__ = (UniqueConstraint('restaurant_id', 'name', name='uq_category_restaurant_name'),)

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str] = mapped_column(String(26), ForeignKey('restaurants.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(120))
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    restaurant: Mapped[Restaurant] = relationship(back_populates='categories')
    products: Mapped[list[Product]] = relationship(back_populates='category', cascade='all, delete-orphan')


class Product(Base, TimestampMixin):
    __tablename__ = 'products'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str] = mapped_column(String(26), ForeignKey('restaurants.id', ondelete='CASCADE'), index=True)
    category_id: Mapped[str] = mapped_column(String(26), ForeignKey('categories.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    restaurant: Mapped[Restaurant] = relationship(back_populates='products')
    category: Mapped[Category] = relationship(back_populates='products')
    options: Mapped[list[ProductOption]] = relationship(back_populates='product', cascade='all, delete-orphan')


class ProductOption(Base, TimestampMixin):
    """Adicional de um produto (ex: 'bacon extra' +R$3,00)."""

    __tablename__ = 'product_options'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    product_id: Mapped[str] = mapped_column(String(26), ForeignKey('products.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(120))
    price_delta: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal('0'))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped[Product] = relationship(back_populates='options')
