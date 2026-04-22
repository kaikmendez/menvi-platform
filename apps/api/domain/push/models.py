from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin


class PushSubscription(Base, TimestampMixin):
    """Assinatura Web Push (PushManager.subscribe) vinculada a um pedido público.

    Usamos o pedido como âncora porque o cliente final não tem conta: ele
    escolhe "Receber notificações" na tela de acompanhamento do próprio pedido
    e a partir daí queremos avisá-lo sempre que o status avançar.
    """

    __tablename__ = 'push_subscriptions'
    __table_args__ = (UniqueConstraint('order_id', 'endpoint', name='uq_push_subscription_order_endpoint'),)

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(String(26), ForeignKey('orders.id', ondelete='CASCADE'), index=True)
    endpoint: Mapped[str] = mapped_column(Text)
    p256dh: Mapped[str] = mapped_column(String(255))
    auth: Mapped[str] = mapped_column(String(255))
