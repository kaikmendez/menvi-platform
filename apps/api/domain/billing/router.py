from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import CurrentUser, get_current_user
from ...core.errors import NotFound
from .models import Subscription, SubscriptionPlan, SubscriptionStatus

router = APIRouter(prefix='/crm/subscription', tags=['billing'])


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan: SubscriptionPlan
    status: SubscriptionStatus
    monthly_price: Decimal
    provider: str | None


@router.get('', response_model=SubscriptionOut)
def read_subscription(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubscriptionOut:
    sub = db.query(Subscription).filter(Subscription.restaurant_id == current_user.restaurant_id).first()
    if sub is None:
        raise NotFound('Assinatura não encontrada')
    return SubscriptionOut.model_validate(sub)
