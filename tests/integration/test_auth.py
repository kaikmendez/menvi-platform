from __future__ import annotations

from fastapi.testclient import TestClient


def test_login_success(client: TestClient, owner_user) -> None:
    resp = client.post('/auth/login', json={'email': owner_user.email, 'password': 'secret123'})
    assert resp.status_code == 200
    body = resp.json()
    assert body['access_token']
    assert body['refresh_token']


def test_login_wrong_password(client: TestClient, owner_user) -> None:
    resp = client.post('/auth/login', json={'email': owner_user.email, 'password': 'wrong'})
    assert resp.status_code == 401


def test_refresh_flow(client: TestClient, owner_user) -> None:
    login = client.post('/auth/login', json={'email': owner_user.email, 'password': 'secret123'}).json()
    resp = client.post('/auth/refresh', json={'refresh_token': login['refresh_token']})
    assert resp.status_code == 200
    assert resp.json()['access_token']


def test_me_requires_token(client: TestClient) -> None:
    resp = client.get('/crm/users/me')
    assert resp.status_code == 401


def test_me_returns_current_user(client: TestClient, owner_user) -> None:
    tokens = client.post('/auth/login', json={'email': owner_user.email, 'password': 'secret123'}).json()
    resp = client.get('/crm/users/me', headers={'Authorization': f'Bearer {tokens["access_token"]}'})
    assert resp.status_code == 200
    assert resp.json()['email'] == owner_user.email
