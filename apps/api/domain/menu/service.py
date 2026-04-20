from __future__ import annotations

from sqlalchemy.orm import Session, selectinload

from ...core.errors import NotFound
from .models import Category, Product, ProductOption


# ---------- Category ----------
def list_categories(db: Session, restaurant_id: str) -> list[Category]:
    return (
        db.query(Category)
        .filter(Category.restaurant_id == restaurant_id)
        .order_by(Category.position, Category.name)
        .all()
    )


def get_category(db: Session, restaurant_id: str, category_id: str) -> Category:
    category = db.query(Category).filter(Category.id == category_id, Category.restaurant_id == restaurant_id).first()
    if category is None:
        raise NotFound('Categoria não encontrada')
    return category


def create_category(db: Session, *, restaurant_id: str, name: str, position: int, is_active: bool) -> Category:
    category = Category(restaurant_id=restaurant_id, name=name.strip(), position=position, is_active=is_active)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, restaurant_id: str, category_id: str, **fields: object) -> Category:
    category = get_category(db, restaurant_id, category_id)
    for k, v in fields.items():
        if v is None:
            continue
        setattr(category, k, v)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, restaurant_id: str, category_id: str) -> None:
    category = get_category(db, restaurant_id, category_id)
    db.delete(category)
    db.commit()


# ---------- Product ----------
def list_products(db: Session, restaurant_id: str) -> list[Product]:
    return (
        db.query(Product)
        .options(selectinload(Product.options))
        .filter(Product.restaurant_id == restaurant_id)
        .order_by(Product.position, Product.name)
        .all()
    )


def get_product(db: Session, restaurant_id: str, product_id: str) -> Product:
    product = (
        db.query(Product)
        .options(selectinload(Product.options))
        .filter(Product.id == product_id, Product.restaurant_id == restaurant_id)
        .first()
    )
    if product is None:
        raise NotFound('Produto não encontrado')
    return product


def create_product(db: Session, *, restaurant_id: str, **fields: object) -> Product:
    # valida categoria pertence ao restaurante
    category_id = fields.get('category_id')
    if not isinstance(category_id, str):
        raise NotFound('Categoria inválida')
    get_category(db, restaurant_id, category_id)
    product = Product(restaurant_id=restaurant_id, **fields)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, restaurant_id: str, product_id: str, **fields: object) -> Product:
    product = get_product(db, restaurant_id, product_id)
    if (new_cat := fields.get('category_id')) is not None and isinstance(new_cat, str):
        get_category(db, restaurant_id, new_cat)
    for k, v in fields.items():
        if v is None:
            continue
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, restaurant_id: str, product_id: str) -> None:
    product = get_product(db, restaurant_id, product_id)
    db.delete(product)
    db.commit()


# ---------- Options ----------
def add_product_option(db: Session, restaurant_id: str, product_id: str, **fields: object) -> ProductOption:
    product = get_product(db, restaurant_id, product_id)
    option = ProductOption(product_id=product.id, **fields)
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


def update_product_option(
    db: Session, restaurant_id: str, product_id: str, option_id: str, **fields: object
) -> ProductOption:
    product = get_product(db, restaurant_id, product_id)
    option = (
        db.query(ProductOption).filter(ProductOption.id == option_id, ProductOption.product_id == product.id).first()
    )
    if option is None:
        raise NotFound('Adicional não encontrado')
    for k, v in fields.items():
        if v is None:
            continue
        setattr(option, k, v)
    db.commit()
    db.refresh(option)
    return option


def delete_product_option(db: Session, restaurant_id: str, product_id: str, option_id: str) -> None:
    product = get_product(db, restaurant_id, product_id)
    option = (
        db.query(ProductOption).filter(ProductOption.id == option_id, ProductOption.product_id == product.id).first()
    )
    if option is None:
        raise NotFound('Adicional não encontrado')
    db.delete(option)
    db.commit()
