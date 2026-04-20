from __future__ import annotations

import enum
from decimal import Decimal

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin


class SubscriptionStatus(str, enum.Enum):
    TRIALING = 'TRIALING'
    ACTIVE = 'ACTIVE'
    PAST_DUE = 'PAST_DUE'
    CANCELED = 'CANCELED'


class SubscriptionPlan(str, enum.Enum):
    STARTER = 'STARTER'
    PRO = 'PRO'
    ENTERPRISE = 'ENTERPRISE'


class Subscription(Base, TimestampMixin):
    """Assinatura do restaurante parceiro à plataforma Menvi (cobrado pela M2)."""

    __tablename__ = 'subscriptions'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str] = mapped_column(
        String(26), ForeignKey('restaurants.id', ondelete='CASCADE'), unique=True, index=True
    )
    plan: Mapped[SubscriptionPlan] = mapped_column(
        SAEnum(SubscriptionPlan, name='subscription_plan'), default=SubscriptionPlan.STARTER
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        SAEnum(SubscriptionStatus, name='subscription_status'), default=SubscriptionStatus.TRIALING
    )
    monthly_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal('0'))
    provider: Mapped[str | None] = mapped_column(String(40), nullable=True)  # 'stripe'
    provider_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
