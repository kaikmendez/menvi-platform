from __future__ import annotations

import os
from collections.abc import Iterator
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from apps.api.core import db as core_db
from apps.api.core.db import Base
from apps.api.core.security import hash_password
from apps.api.domain.restaurants.models import Restaurant, RestaurantSettings
from apps.api.domain.users.models import User, UserRole
from apps.api.main import app


@pytest.fixture(scope='session')
def test_engine():
    url = os.getenv('DATABASE_URL', 'postgresql+psycopg://menvi:menvi@localhost:5432/menvi_test')
    # Garante isolamento: recria schema por sessão de testes.
    engine = create_engine(url, future=True)
    with engine.begin() as conn:
        conn.execute(text('DROP SCHEMA public CASCADE'))
        conn.execute(text('CREATE SCHEMA public'))
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db(test_engine) -> Iterator[Session]:
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False, expire_on_commit=False)
    session = TestingSessionLocal()
    try:
        # Limpa dados entre testes (ordem respeita FKs).
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()
        yield session
    finally:
        session.close()


@pytest.fixture
def client(test_engine) -> Iterator[TestClient]:
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False, expire_on_commit=False)

    def _override_get_db() -> Iterator[Session]:
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[core_db.get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def demo_restaurant(db: Session) -> Restaurant:
    r = Restaurant(slug='demo', name='Demo')
    r.settings = RestaurantSettings(
        delivery_fee=Decimal('5.00'),
        min_order_amount=Decimal('10.00'),
        accepts_pix=True,
        accepts_card=True,
        accepts_cash=True,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@pytest.fixture
def owner_user(db: Session, demo_restaurant: Restaurant) -> User:
    u = User(
        restaurant_id=demo_restaurant.id,
        email='owner@demo.com',
        name='Owner',
        password_hash=hash_password('secret123'),
        role=UserRole.OWNER,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u
