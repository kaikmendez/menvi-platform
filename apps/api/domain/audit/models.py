from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin


class AuditLog(Base, TimestampMixin):
    """Log genérico de ações sensíveis (mudança de preço, cancelamento, refund, etc)."""

    __tablename__ = 'audit_log'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str | None] = mapped_column(
        String(26), ForeignKey('restaurants.id', ondelete='SET NULL'), nullable=True, index=True
    )
    actor_user_id: Mapped[str | None] = mapped_column(String(26), nullable=True)
    action: Mapped[str] = mapped_column(String(80), index=True)  # ex: 'order.cancel', 'product.price_change'
    target_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(26), nullable=True)
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)
