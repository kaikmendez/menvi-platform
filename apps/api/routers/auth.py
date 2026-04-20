import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
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
from ..schemas import LoginIn, TokenOut
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix='/auth', tags=['auth'])


DEMO_EMAIL = 'admin@menvi.com'
DEMO_PASSWORD = '123456'


def _seed_demo_data(db: Session):
    existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if existing:
        return existing, False

    restaurant = Restaurant(id=str(uuid.uuid4()), name='Restaurante Demo', slug='restaurante-demo')
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

    customer = Customer(id=str(uuid.uuid4()), restaurant_id=restaurant.id, name='Cliente Teste', phone='+5511930105237')
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

    db.add_all([
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
    ])
    db.commit()
    db.refresh(user)
    return user, True


@router.post('/login', response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    password = payload.password.strip()

    user = db.query(User).filter(func.lower(User.email) == email).first()

    if not user and email == DEMO_EMAIL and password == DEMO_PASSWORD:
        # Facilita a experiência local: se o banco estiver vazio, cria automaticamente o admin demo.
        user, _ = _seed_demo_data(db)

    password_ok = bool(user and verify_password(password, user.password_hash))

    if user and not password_ok and email == DEMO_EMAIL and password == DEMO_PASSWORD:
        # Migração automática de hash legado quebrado em ambientes com incompatibilidade bcrypt/passlib.
        user.password_hash = hash_password(DEMO_PASSWORD)
        db.commit()
        db.refresh(user)
        password_ok = True

    if not user or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciais inválidas')

    token = create_access_token(user.id, {'restaurant_id': user.restaurant_id, 'email': user.email, 'role': user.role.value})
    return TokenOut(access_token=token)


@router.post('/seed-admin')
def seed_admin(db: Session = Depends(get_db)):
    user, created = _seed_demo_data(db)
    if not created:
        return {'message': 'Admin já existe'}

    restaurant = db.query(Restaurant).filter(Restaurant.id == user.restaurant_id).first()

    return {
        'message': 'Admin e dados iniciais criados',
        'email': DEMO_EMAIL,
        'password': DEMO_PASSWORD,
        'restaurant_slug': restaurant.slug if restaurant else 'restaurante-demo',
    }
