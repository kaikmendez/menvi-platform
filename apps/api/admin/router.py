from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import require_admin_token
from ..domain.billing.models import Subscription, SubscriptionPlan, SubscriptionStatus
from ..domain.restaurants import service as restaurant_service
from ..domain.users import service as user_service
from ..domain.users.models import UserRole

router = APIRouter(prefix='/admin', tags=['admin'], dependencies=[Depends(require_admin_token)])


class CreateRestaurantIn(BaseModel):
    slug: str = Field(min_length=2, max_length=64, pattern=r'^[a-z0-9-]+$')
    name: str = Field(min_length=1, max_length=160)
    owner_email: EmailStr
    owner_name: str
    owner_password: str = Field(min_length=6)
    plan: SubscriptionPlan = SubscriptionPlan.STARTER


class CreateRestaurantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    restaurant_id: str
    slug: str
    owner_user_id: str
    owner_email: EmailStr


class ChangePlanIn(BaseModel):
    plan: SubscriptionPlan
    status: SubscriptionStatus | None = None
    monthly_price: Decimal | None = None


@router.post('/restaurants', response_model=CreateRestaurantOut, status_code=status.HTTP_201_CREATED)
def create_restaurant(payload: CreateRestaurantIn, db: Session = Depends(get_db)) -> CreateRestaurantOut:
    restaurant = restaurant_service.create_restaurant(db, slug=payload.slug, name=payload.name)
    owner = user_service.create_user(
        db,
        restaurant_id=restaurant.id,
        email=payload.owner_email,
        name=payload.owner_name,
        password=payload.owner_password,
        role=UserRole.OWNER,
    )
    subscription = Subscription(
        restaurant_id=restaurant.id,
        plan=payload.plan,
        status=SubscriptionStatus.TRIALING,
    )
    db.add(subscription)
    db.commit()
    return CreateRestaurantOut(
        restaurant_id=restaurant.id,
        slug=restaurant.slug,
        owner_user_id=owner.id,
        owner_email=owner.email,
    )


@router.get('/restaurants')
def list_restaurants(db: Session = Depends(get_db)) -> list[dict]:
    rows = restaurant_service  # noqa: F841 (alias kept for readability)
    from ..domain.restaurants.models import Restaurant

    return [
        {'id': r.id, 'slug': r.slug, 'name': r.name, 'is_open': r.is_open, 'created_at': r.created_at}
        for r in db.query(Restaurant).order_by(Restaurant.created_at.desc()).all()
    ]


@router.post('/restaurants/{restaurant_id}/plan')
def change_plan(restaurant_id: str, payload: ChangePlanIn, db: Session = Depends(get_db)) -> dict:
    sub = db.query(Subscription).filter(Subscription.restaurant_id == restaurant_id).first()
    if sub is None:
        sub = Subscription(restaurant_id=restaurant_id, plan=payload.plan)
        db.add(sub)
    else:
        sub.plan = payload.plan
    if payload.status is not None:
        sub.status = payload.status
    if payload.monthly_price is not None:
        sub.monthly_price = payload.monthly_price
    db.commit()
    db.refresh(sub)
    return {
        'restaurant_id': restaurant_id,
        'plan': sub.plan.value,
        'status': sub.status.value,
        'monthly_price': str(sub.monthly_price),
    }


class ResetPasswordIn(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=6)


@router.post('/reset-password')
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)) -> dict:
    from ..domain.users.models import User

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        return {'ok': False, 'reason': 'not_found'}
    user_service.set_password(db, user_id=user.id, password=payload.new_password)
    return {'ok': True, 'user_id': user.id}
