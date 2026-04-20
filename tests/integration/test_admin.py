from __future__ import annotations

from fastapi.testclient import TestClient

from apps.api.core.config import settings


def test_admin_requires_token(client: TestClient) -> None:
    resp = client.get('/admin/restaurants')
    assert resp.status_code == 401


def test_admin_creates_restaurant_and_owner(client: TestClient) -> None:
    headers = {'X-Admin-Token': settings.admin_api_token}
    payload = {
        'slug': 'cantina-ju',
        'name': 'Cantina da Ju',
        'owner_email': 'ju@cantina.com',
        'owner_name': 'Ju',
        'owner_password': 'senha-forte',
    }
    resp = client.post('/admin/restaurants', headers=headers, json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body['slug'] == 'cantina-ju'

    # Owner criado consegue logar
    login = client.post('/auth/login', json={'email': 'ju@cantina.com', 'password': 'senha-forte'})
    assert login.status_code == 200
