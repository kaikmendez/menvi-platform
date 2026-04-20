"""Seed de dados demo.

Extraído de `routers/auth.py` para manter autenticação e seeding separados.

Uso:

    python -m apps.api.seed            # executa o seed se ainda não existir
    python -m apps.api.seed --force    # recria o seed (apaga o restaurante demo primeiro)
"""

from __future__ import annotations

import argparse
import uuid

from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import (
    Category,
    Customer,
    Order,
    OrderItem,
    OrderItemOption,
    OrderStatus,
    Product,
    ProductOption,
    Restaurant,
    User,
    UserRole,
)
from .security import hash_password

DEMO_EMAIL = 'admin@menvi.com'
DEMO_PASSWORD = '123456'
DEMO_SLUG = 'restaurante-demo'


def seed_demo_data(db: Session) -> tuple[User, bool]:
    """Cria restaurante, usuário admin, categorias, produtos, cliente e pedido demo.

    Retorna `(user, created)`. Se já existir, apenas retorna o usuário com `created=False`.
    """
    existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if existing:
        return existing, False

    restaurant = Restaurant(id=str(uuid.uuid4()), name='Restaurante Demo', slug=DEMO_SLUG)
    user = User(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        name='Admin',
        email=DEMO_EMAIL,
        password_hash=hash_password(DEMO_PASSWORD),
        role=UserRole.OWNER,
    )

    category = Category(id=str(uuid.uuid4()), restaurant_id=restaurant.id, name='Destaques', sort_order=1)
    product_1 = Product(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        category_id=category.id,
        name='Combo Executivo',
        description='Prato + bebida',
        price=67.00,
        is_active=True,
    )
    product_2 = Product(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        category_id=category.id,
        name='Hambúrguer Artesanal',
        description='Pão brioche, blend bovino e fritas',
        price=39.90,
        is_active=True,
    )

    option_1 = ProductOption(
        id=str(uuid.uuid4()),
        product_id=product_1.id,
        name='Suco natural',
        price_impact=5.00,
        is_required=False,
    )
    option_2 = ProductOption(
        id=str(uuid.uuid4()),
        product_id=product_2.id,
        name='Queijo extra',
        price_impact=3.50,
        is_required=False,
    )

    customer = Customer(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        name='Cliente Teste',
        phone='+5511930105237',
    )
    order = Order(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        customer_id=customer.id,
        status=OrderStatus.PENDING,
        total_amount=72.00,
        notes='Sem cebola no combo.',
    )
    order_item = OrderItem(
        id=str(uuid.uuid4()),
        order_id=order.id,
        product_id=product_1.id,
        quantity=1,
        unit_price=72.00,
        note='Suco de laranja',
    )
    order_item_option = OrderItemOption(
        id=str(uuid.uuid4()),
        order_item_id=order_item.id,
        product_option_id=option_1.id,
    )

    db.add_all(
        [
            restaurant,
            user,
            category,
            product_1,
            product_2,
            option_1,
            option_2,
            customer,
            order,
            order_item,
            order_item_option,
        ]
    )
    db.commit()
    db.refresh(user)
    return user, True


def _reset_demo(db: Session) -> None:
    restaurant = db.query(Restaurant).filter(Restaurant.slug == DEMO_SLUG).first()
    if restaurant:
        db.delete(restaurant)  # cascade cuida de users/categories/products/orders/customers
        db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description='Seed de dados demo da Menvi.')
    parser.add_argument('--force', action='store_true', help='Recria o seed do zero.')
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.force:
            _reset_demo(db)

        user, created = seed_demo_data(db)
        if created:
            print(f'[seed] admin criado: {user.email} / senha: {DEMO_PASSWORD}')
            print(f'[seed] restaurante slug: {DEMO_SLUG}')
        else:
            print(f'[seed] admin já existe: {user.email}')
    finally:
        db.close()


if __name__ == '__main__':
    main()
