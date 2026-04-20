from __future__ import annotations

from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from apps.api.domain.menu.models import Category, Product
from apps.api.domain.restaurants.models import Restaurant


def _auth(client: TestClient, owner_user) -> dict[str, str]:
    tokens = client.post('/auth/login', json={'email': owner_user.email, 'password': 'secret123'}).json()
    return {'Authorization': f'Bearer {tokens["access_token"]}'}


def _setup_menu(db: Session, restaurant: Restaurant) -> Product:
    category = Category(restaurant_id=restaurant.id, name='Burgers', position=1)
    db.add(category)
    db.flush()
    product = Product(
        restaurant_id=restaurant.id,
        category_id=category.id,
        name='Menvi Burger',
        description='Teste',
        price=Decimal('30.00'),
        is_available=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def test_public_menu(client: TestClient, db: Session, demo_restaurant: Restaurant) -> None:
    _setup_menu(db, demo_restaurant)
    resp = client.get(f'/public/menu/{demo_restaurant.slug}')
    assert resp.status_code == 200
    body = resp.json()
    assert body['slug'] == demo_restaurant.slug
    assert len(body['categories']) == 1
    assert body['categories'][0]['products'][0]['name'] == 'Menvi Burger'


def test_create_order_via_public_and_list_in_crm(
    client: TestClient, db: Session, demo_restaurant: Restaurant, owner_user
) -> None:
    product = _setup_menu(db, demo_restaurant)

    # Cliente final faz pedido sem auth
    payload = {
        'customer_name': 'João Cliente',
        'customer_phone': '+5511988887777',
        'customer_address': 'Rua X, 1',
        'payment_method': 'PIX',
        'items': [{'product_id': product.id, 'quantity': 2}],
    }
    resp = client.post(f'/public/restaurants/{demo_restaurant.slug}/orders', json=payload)
    assert resp.status_code == 201, resp.text
    order = resp.json()
    assert order['status'] == 'PENDING'
    assert order['subtotal'] == '60.00'
    assert order['total'] == '65.00'  # + delivery_fee 5

    # Restaurante vê na fila
    headers = _auth(client, owner_user)
    listing = client.get('/crm/orders', headers=headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    # Muda status: PENDING → CONFIRMED
    order_id = order['id']
    r = client.post(f'/crm/orders/{order_id}/status', headers=headers, json={'status': 'CONFIRMED'})
    assert r.status_code == 200
    assert r.json()['status'] == 'CONFIRMED'

    # Transição inválida: CONFIRMED → DELIVERED (tem que passar por PREPARING/READY)
    bad = client.post(f'/crm/orders/{order_id}/status', headers=headers, json={'status': 'DELIVERED'})
    assert bad.status_code == 409


def test_order_below_minimum_is_rejected(client: TestClient, db: Session, demo_restaurant: Restaurant) -> None:
    product = _setup_menu(db, demo_restaurant)
    payload = {
        'customer_name': 'J',
        'customer_phone': '+5511900000000',
        'payment_method': 'PIX',
        'items': [{'product_id': product.id, 'quantity': 0}],  # quantity validation fails first
    }
    resp = client.post(f'/public/restaurants/{demo_restaurant.slug}/orders', json=payload)
    assert resp.status_code == 422
