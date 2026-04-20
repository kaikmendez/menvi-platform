from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import CurrentUser, get_current_user, require_owner
from . import service
from .schemas import (
    RestaurantOut,
    RestaurantSettingsOut,
    RestaurantSettingsUpdateIn,
    RestaurantUpdateIn,
)

router = APIRouter(prefix='/crm/restaurant', tags=['restaurant'])


@router.get('', response_model=RestaurantOut)
def read_restaurant(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RestaurantOut:
    restaurant = service.get_restaurant(db, current_user.restaurant_id)
    return RestaurantOut.model_validate(restaurant)


@router.patch('', response_model=RestaurantOut)
def update_restaurant(
    payload: RestaurantUpdateIn,
    current_user: CurrentUser = Depends(require_owner),
    db: Session = Depends(get_db),
) -> RestaurantOut:
    restaurant = service.update_restaurant(
        db,
        current_user.restaurant_id,
        **payload.model_dump(exclude_unset=True),
    )
    return RestaurantOut.model_validate(restaurant)


@router.get('/settings', response_model=RestaurantSettingsOut)
def read_settings(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RestaurantSettingsOut:
    s = service.get_settings(db, current_user.restaurant_id)
    return RestaurantSettingsOut.model_validate(s)


@router.patch('/settings', response_model=RestaurantSettingsOut)
def update_settings(
    payload: RestaurantSettingsUpdateIn,
    current_user: CurrentUser = Depends(require_owner),
    db: Session = Depends(get_db),
) -> RestaurantSettingsOut:
    s = service.update_settings(
        db,
        current_user.restaurant_id,
        **payload.model_dump(exclude_unset=True),
    )
    return RestaurantSettingsOut.model_validate(s)
