from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import CurrentUser, get_current_user
from ..models import Category

router = APIRouter(prefix='/categories', tags=['categories'])


@router.get('')
def list_items(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    categories = (
        db.query(Category)
        .filter(Category.restaurant_id == current_user.restaurant_id)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return {
        'data': [
            {'id': category.id, 'name': category.name, 'sort_order': category.sort_order} for category in categories
        ]
    }
