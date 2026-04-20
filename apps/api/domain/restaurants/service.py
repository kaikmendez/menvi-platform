from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import Session

from ...core.errors import Conflict, NotFound
from .models import Restaurant, RestaurantSettings


def get_restaurant(db: Session, restaurant_id: str) -> Restaurant:
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if r is None:
        raise NotFound('Restaurante não encontrado')
    return r


def get_by_slug(db: Session, slug: str) -> Restaurant:
    r = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if r is None:
        raise NotFound('Restaurante não encontrado')
    return r


def create_restaurant(db: Session, *, slug: str, name: str) -> Restaurant:
    slug = slug.strip().lower()
    existing = db.query(Restaurant).filter(Restaurant.slug == slug).first()
    if existing is not None:
        raise Conflict('Slug já em uso')
    restaurant = Restaurant(slug=slug, name=name.strip())
    restaurant.settings = RestaurantSettings(
        delivery_fee=Decimal('0'),
        min_order_amount=Decimal('0'),
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


def update_restaurant(db: Session, restaurant_id: str, **fields: object) -> Restaurant:
    restaurant = get_restaurant(db, restaurant_id)
    for key, value in fields.items():
        if value is None:
            continue
        setattr(restaurant, key, value)
    db.commit()
    db.refresh(restaurant)
    return restaurant


def get_settings(db: Session, restaurant_id: str) -> RestaurantSettings:
    s = db.query(RestaurantSettings).filter(RestaurantSettings.restaurant_id == restaurant_id).first()
    if s is None:
        raise NotFound('Configurações não encontradas')
    return s


def update_settings(db: Session, restaurant_id: str, **fields: object) -> RestaurantSettings:
    settings = get_settings(db, restaurant_id)
    for key, value in fields.items():
        if value is None:
            continue
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
