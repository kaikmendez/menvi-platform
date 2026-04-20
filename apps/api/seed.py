"""Seed de dados demo. Executa idempotente via `python -m apps.api.seed`.

Cria:
- restaurante `restaurante-demo`
- usuário OWNER `admin@menvi.com` / senha `123456`
- 3 categorias, 5 produtos, 3 adicionais
- 1 cliente + 1 pedido em PENDING pra CRM visualizar
- assinatura TRIALING no plano STARTER
"""

from __future__ import annotations

import argparse
from decimal import Decimal

from sqlalchemy.orm import Session

from .core.db import SessionLocal
from .core.security import hash_password
from .domain.billing.models import Subscription, SubscriptionPlan, SubscriptionStatus
from .domain.customers.models import Customer
from .domain.menu.models import Category, Product, ProductOption
from .domain.orders.models import (
    Order,
    OrderEvent,
    OrderItem,
    OrderItemOption,
    OrderStatus,
    PaymentMethod,
)
from .domain.restaurants.models import Restaurant, RestaurantSettings
from .domain.users.models import User, UserRole

DEMO_SLUG = 'restaurante-demo'
DEMO_EMAIL = 'admin@menvi.com'
DEMO_PASSWORD = '123456'


def _reset(db: Session) -> None:
    r = db.query(Restaurant).filter(Restaurant.slug == DEMO_SLUG).first()
    if r is not None:
        db.delete(r)
        db.commit()


def seed(db: Session) -> tuple[Restaurant, bool]:
    existing = db.query(Restaurant).filter(Restaurant.slug == DEMO_SLUG).first()
    if existing is not None:
        return existing, False

    restaurant = Restaurant(
        slug=DEMO_SLUG,
        name='Restaurante Demo',
        description='Cantina de demonstração da plataforma Menvi.',
        whatsapp_phone='+5511999999999',
        logo_url=None,
        cover_url=None,
        is_open=True,
    )
    restaurant.settings = RestaurantSettings(
        delivery_fee=Decimal('5.00'),
        min_order_amount=Decimal('20.00'),
        accepts_pix=True,
        accepts_card=True,
        accepts_cash=True,
    )
    db.add(restaurant)
    db.flush()

    owner = User(
        restaurant_id=restaurant.id,
        email=DEMO_EMAIL,
        name='Admin Demo',
        password_hash=hash_password(DEMO_PASSWORD),
        role=UserRole.OWNER,
    )
    db.add(owner)

    cat_hamburgers = Category(restaurant_id=restaurant.id, name='Hambúrgueres', position=1)
    cat_drinks = Category(restaurant_id=restaurant.id, name='Bebidas', position=2)
    cat_desserts = Category(restaurant_id=restaurant.id, name='Sobremesas', position=3)
    db.add_all([cat_hamburgers, cat_drinks, cat_desserts])
    db.flush()

    p1 = Product(
        restaurant_id=restaurant.id,
        category_id=cat_hamburgers.id,
        name='Menvi Burger',
        description='Pão brioche, blend 180g, cheddar, alface, tomate e molho da casa.',
        price=Decimal('32.00'),
        is_available=True,
        position=1,
    )
    p2 = Product(
        restaurant_id=restaurant.id,
        category_id=cat_hamburgers.id,
        name='Chicken Burger',
        description='Frango crispy, bacon, cebola caramelizada.',
        price=Decimal('28.00'),
        position=2,
    )
    p3 = Product(
        restaurant_id=restaurant.id,
        category_id=cat_drinks.id,
        name='Coca-Cola Lata',
        description='350ml, gelada.',
        price=Decimal('7.00'),
    )
    p4 = Product(
        restaurant_id=restaurant.id,
        category_id=cat_drinks.id,
        name='Suco Natural',
        description='Laranja, abacaxi ou maracujá.',
        price=Decimal('9.00'),
    )
    p5 = Product(
        restaurant_id=restaurant.id,
        category_id=cat_desserts.id,
        name='Brownie com sorvete',
        description='Brownie morno + 2 bolas de baunilha.',
        price=Decimal('18.00'),
    )
    db.add_all([p1, p2, p3, p4, p5])
    db.flush()

    opt_bacon = ProductOption(product_id=p1.id, name='Bacon extra', price_delta=Decimal('4.00'))
    opt_egg = ProductOption(product_id=p1.id, name='Ovo', price_delta=Decimal('2.50'))
    opt_cheese = ProductOption(product_id=p2.id, name='Cheddar extra', price_delta=Decimal('3.00'))
    db.add_all([opt_bacon, opt_egg, opt_cheese])
    db.flush()

    customer = Customer(
        restaurant_id=restaurant.id,
        name='Maria Cliente',
        phone='+5511988887777',
        email='maria@example.com',
        address='Rua das Flores, 123 - São Paulo',
    )
    db.add(customer)
    db.flush()

    item_unit = p1.price + opt_bacon.price_delta
    item_total = item_unit * 1
    order = Order(
        restaurant_id=restaurant.id,
        customer_id=customer.id,
        code=1,
        status=OrderStatus.PENDING,
        payment_method=PaymentMethod.PIX,
        subtotal=item_total,
        delivery_fee=restaurant.settings.delivery_fee,
        total=item_total + restaurant.settings.delivery_fee,
        notes='Sem cebola no hambúrguer.',
    )
    order.items = [
        OrderItem(
            product_id=p1.id,
            product_name=p1.name,
            unit_price=item_unit,
            quantity=1,
            total=item_total,
            options=[
                OrderItemOption(
                    product_option_id=opt_bacon.id,
                    name=opt_bacon.name,
                    price_delta=opt_bacon.price_delta,
                )
            ],
        )
    ]
    order.events = [OrderEvent(from_status=None, to_status=OrderStatus.PENDING, note='Pedido demo')]
    db.add(order)

    subscription = Subscription(
        restaurant_id=restaurant.id,
        plan=SubscriptionPlan.STARTER,
        status=SubscriptionStatus.TRIALING,
    )
    db.add(subscription)

    db.commit()
    db.refresh(restaurant)
    return restaurant, True


def main() -> None:
    parser = argparse.ArgumentParser(description='Seed de dados demo da Menvi.')
    parser.add_argument('--force', action='store_true', help='Recria o restaurante demo do zero.')
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.force:
            _reset(db)
        restaurant, created = seed(db)
        if created:
            print(f'[seed] OK — restaurante "{restaurant.slug}" criado.')
            print(f'[seed] Login CRM:  {DEMO_EMAIL} / {DEMO_PASSWORD}')
            print(f'[seed] Menu URL:   /public/menu/{restaurant.slug}')
        else:
            print(f'[seed] restaurante "{restaurant.slug}" já existe — sem alterações. Use --force pra recriar.')
    finally:
        db.close()


if __name__ == '__main__':
    main()
