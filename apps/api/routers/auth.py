import uuid

from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post('/login', response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciais inválidas')

    token = create_access_token(user.id, {'restaurant_id': user.restaurant_id, 'email': user.email, 'role': user.role.value})
    return TokenOut(access_token=token)


@router.post('/seed-admin')
def seed_admin(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == 'admin@menvi.com').first()
    if existing:
        return {'message': 'Admin já existe'}

    restaurant = Restaurant(id=str(uuid.uuid4()), name='Restaurante Demo', slug='restaurante-demo')
    user = User(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        name='Admin',
        email='admin@menvi.com',
        password_hash=hash_password('123456'),
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

    return {
        'message': 'Admin e dados iniciais criados',
        'email': 'admin@menvi.com',
        'password': '123456',
        'restaurant_slug': restaurant.slug,
    }
