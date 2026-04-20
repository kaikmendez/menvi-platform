import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
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

    from ..models import Restaurant, UserRole

    restaurant = Restaurant(id=str(uuid.uuid4()), name='Restaurante Demo', slug='restaurante-demo')
    user = User(
        id=str(uuid.uuid4()),
        restaurant_id=restaurant.id,
        name='Admin',
        email='admin@menvi.com',
        password_hash=hash_password('123456'),
        role=UserRole.OWNER
    )
    db.add(restaurant)
    db.add(user)
    db.commit()
    return {'message': 'Admin criado', 'email': 'admin@menvi.com', 'password': '123456'}
