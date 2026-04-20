from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from ..core.db import get_db
from ..core.realtime import hub
from ..domain.menu.models import Category, Product
from ..domain.menu.schemas import (
    ProductOptionOut,
    ProductOut,
    PublicCategoryOut,
    PublicMenuOut,
)
from ..domain.orders import service as order_service
from ..domain.orders.schemas import OrderCreateIn, OrderOut, PublicOrderOut
from ..domain.payments.service import create_pending_payment_for_order
from ..domain.restaurants import service as restaurant_service

router = APIRouter(prefix='/public', tags=['public'])


@router.get('/menu/{slug}', response_model=PublicMenuOut)
def get_public_menu(slug: str, db: Session = Depends(get_db)) -> PublicMenuOut:
    restaurant = restaurant_service.get_by_slug(db, slug)
    settings = restaurant_service.get_settings(db, restaurant.id)

    categories = (
        db.query(Category)
        .filter(Category.restaurant_id == restaurant.id, Category.is_active.is_(True))
        .order_by(Category.position, Category.name)
        .all()
    )
    products_by_cat: dict[str, list[Product]] = {c.id: [] for c in categories}
    products = (
        db.query(Product)
        .options(selectinload(Product.options))
        .filter(Product.restaurant_id == restaurant.id, Product.is_available.is_(True))
        .order_by(Product.position, Product.name)
        .all()
    )
    for p in products:
        products_by_cat.setdefault(p.category_id, []).append(p)

    return PublicMenuOut(
        restaurant_id=restaurant.id,
        slug=restaurant.slug,
        name=restaurant.name,
        description=restaurant.description,
        logo_url=restaurant.logo_url,
        cover_url=restaurant.cover_url,
        is_open=restaurant.is_open,
        delivery_fee=settings.delivery_fee,
        min_order_amount=settings.min_order_amount,
        accepts_pix=settings.accepts_pix,
        accepts_card=settings.accepts_card,
        accepts_cash=settings.accepts_cash,
        categories=[
            PublicCategoryOut(
                id=c.id,
                name=c.name,
                position=c.position,
                products=[
                    ProductOut(
                        id=p.id,
                        category_id=p.category_id,
                        name=p.name,
                        description=p.description,
                        price=p.price,
                        image_url=p.image_url,
                        is_available=p.is_available,
                        position=p.position,
                        options=[ProductOptionOut.model_validate(o) for o in p.options if o.is_available],
                    )
                    for p in products_by_cat.get(c.id, [])
                ],
            )
            for c in categories
        ],
    )


@router.post('/restaurants/{slug}/orders', response_model=OrderOut, status_code=201)
def create_order_public(slug: str, payload: OrderCreateIn, db: Session = Depends(get_db)) -> OrderOut:
    """Checkout do cardápio — endpoint sem auth, consumido pelo `menu-web`."""
    restaurant = restaurant_service.get_by_slug(db, slug)
    order = order_service.create_order(
        db,
        restaurant_id=restaurant.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        customer_address=payload.customer_address,
        payment_method=payload.payment_method,
        notes=payload.notes,
        items_in=payload.items,
    )
    create_pending_payment_for_order(db, order)
    out = OrderOut.model_validate(order)
    hub.publish_sync(restaurant.id, 'order.created', out.model_dump(mode='json'))
    return out


@router.get('/orders/{order_id}', response_model=PublicOrderOut)
def get_order_public(order_id: str, db: Session = Depends(get_db)) -> PublicOrderOut:
    order = order_service.get_order_public(db, order_id)
    return PublicOrderOut.model_validate(order)
