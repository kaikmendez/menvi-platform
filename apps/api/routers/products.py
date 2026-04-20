from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..deps import CurrentUser, get_current_user
from ..models import Category, Product

router = APIRouter(prefix='/products', tags=['products'])


@router.get('')
def list_items(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.restaurant_id == current_user.restaurant_id)
        .order_by(Product.name.asc())
        .all()
    )

    categories = db.query(Category).filter(Category.restaurant_id == current_user.restaurant_id).all()

    return {
        'categories': [{'id': category.id, 'name': category.name} for category in categories],
        'data': [
            {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': float(product.price),
                'is_active': product.is_active,
                'category_id': product.category_id,
                'category_name': product.category.name if product.category else '-',
            }
            for product in products
        ],
    }


@router.patch('/{product_id}/availability')
def toggle_availability(
    product_id: str,
    payload: dict,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    is_active = payload.get('is_active')
    if not isinstance(is_active, bool):
        raise HTTPException(status_code=400, detail='Campo is_active deve ser booleano')

    product = (
        db.query(Product)
        .filter(and_(Product.id == product_id, Product.restaurant_id == current_user.restaurant_id))
        .first()
    )

    if not product:
        raise HTTPException(status_code=404, detail='Produto não encontrado')

    product.is_active = is_active
    db.commit()
    db.refresh(product)

    return {'id': product.id, 'is_active': product.is_active}
