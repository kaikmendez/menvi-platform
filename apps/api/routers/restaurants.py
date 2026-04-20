from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..deps import CurrentUser, get_current_user
from ..models import Category, Product, Restaurant

router = APIRouter(prefix='/restaurants', tags=['restaurants'])


@router.get('')
def list_items(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    restaurants = db.query(Restaurant).filter(Restaurant.id == current_user.restaurant_id).all()
    return {'data': [{'id': item.id, 'name': item.name, 'slug': item.slug} for item in restaurants]}


@router.get('/public/{slug}/menu')
def get_public_menu(slug: str, db: Session = Depends(get_db)) -> dict:
    restaurant = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail='Restaurante não encontrado')

    categories = (
        db.query(Category)
        .options(joinedload(Category.products).joinedload(Product.options))
        .filter(Category.restaurant_id == restaurant.id)
        .order_by(Category.sort_order.asc())
        .all()
    )

    return {
        'restaurant': {'id': restaurant.id, 'name': restaurant.name, 'slug': restaurant.slug},
        'categories': [
            {
                'id': category.id,
                'name': category.name,
                'sort_order': category.sort_order,
                'products': [
                    {
                        'id': product.id,
                        'name': product.name,
                        'description': product.description,
                        'price': float(product.price),
                        'is_active': product.is_active,
                        'options': [
                            {
                                'id': option.id,
                                'name': option.name,
                                'price_impact': float(option.price_impact),
                                'is_required': option.is_required,
                            }
                            for option in product.options
                        ],
                    }
                    for product in category.products
                    if product.is_active
                ],
            }
            for category in categories
        ],
    }
