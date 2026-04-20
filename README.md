# Menvi Platform (Python Edition)

Reestruturação da base para **Python + FastAPI + SQLAlchemy + HTML (Jinja2)**.

## Stack atual

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis + RQ (preparado)
- JWT
- Jinja2 (páginas HTML de menu e CRM)
- Docker Compose (Postgres + Redis)

## Estrutura

```text
apps/
  api/
    main.py
    models.py
    routers/
    templates/
requirements.txt
.env.example
docker-compose.yml
```

## Rodar localmente

1. Subir infra:
```bash
docker compose up -d
```

2. Criar venv e instalar libs:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> Se aparecer erro de `email_validator`, rode novamente `pip install -r requirements.txt`.

3. Configurar env:
```bash
cp .env.example .env
```

4. Rodar API:
```bash
python -m apps.api.run
```

## URLs

- API docs: http://localhost:8000/docs
- Menu home: http://localhost:8000/
- CRM login: http://localhost:8000/crm/login

## Rotas iniciais de API

- `POST /auth/seed-admin`
- `POST /auth/login`
- `GET /restaurants`
- `GET /categories`
- `GET /products`
- `GET /orders`
- `GET /customers`

As rotas de domínio usam JWT Bearer.


## Front-end (templates + assets)

A interface agora usa assets separados:

- `apps/api/static/css/menu.css`
- `apps/api/static/css/crm.css`
- `apps/api/static/js/menu.js`
- `apps/api/static/js/crm-base.js`
- `apps/api/static/js/crm-login.js`
- `apps/api/static/js/crm-dashboard.js`

Esses arquivos são servidos por `/static/*` no FastAPI.

