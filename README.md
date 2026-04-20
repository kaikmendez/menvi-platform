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

2. Criar venv e instalar libs (usar `requirements-dev.txt` para desenvolvimento):
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
pre-commit install
```

> Se aparecer erro de `email_validator`, rode novamente `pip install -r requirements-dev.txt`.

3. Configurar env:
```bash
cp .env.example .env
```

4. Aplicar migrations:
```bash
alembic upgrade head
```

5. Popular dados demo (opcional, mas recomendado para testar o fluxo):
```bash
python -m apps.api.seed
# ou para recriar do zero:
python -m apps.api.seed --force
```

6. Rodar API:
```bash
python -m apps.api.run
```

## Qualidade de código

Checks rodam localmente antes do commit (via pre-commit) e no CI:

```bash
ruff check .          # lint
ruff format --check . # formatação (ruff)
black --check .       # formatação (black)
mypy apps/api         # typecheck
```

## Migrations (Alembic)

O schema do banco é gerenciado pelo Alembic — **não** usamos mais `Base.metadata.create_all` no boot.

```bash
# aplicar todas as migrations
alembic upgrade head

# gerar uma nova migration a partir das mudanças nos modelos
alembic revision --autogenerate -m "minha mudanca"

# voltar uma versão
alembic downgrade -1
```

## URLs

- API docs: http://localhost:8000/docs
- Menu home: http://localhost:8000/
- Menu checkout: http://localhost:8000/menu/cart
- CRM login: http://localhost:8000/crm/login
- CRM pedidos: http://localhost:8000/crm/dashboard

## Fluxo ponta a ponta (menu → API → CRM)

1. O cliente abre `/menu/cart`.
2. O front do menu carrega catálogo via `GET /restaurants/public/{slug}/menu`.
3. Ao finalizar, envia payload para `POST /public/orders` com cliente + itens + adicionais.
4. A API valida produto/opções, calcula preço final, persiste `Customer`, `Order`, `OrderItem` e `OrderItemOption`.
5. O CRM (`/crm/dashboard`) busca os pedidos via `GET /orders` com JWT.
6. A tela mostra listagem, filtro por status, detalhes do pedido e ações de atualização.
7. A atualização de status é feita por `PATCH /orders/{id}/status` e refetch da lista.

> Tempo real por WebSocket ainda não está ativo; o painel já está preparado com refetch manual e em eventos de mudança de status.

## Rotas de API (principais)

### Públicas (menu)
- `GET /restaurants/public/{slug}/menu`
- `POST /public/orders`

### Autenticadas (CRM)
- `POST /auth/login`
- `GET /orders`
- `GET /orders/{order_id}`
- `PATCH /orders/{order_id}/status`
- `GET /restaurants`

As rotas autenticadas usam JWT Bearer.

## Front-end (templates + assets)

A interface usa assets separados:

- `apps/api/static/css/menu.css`
- `apps/api/static/css/crm.css`
- `apps/api/static/js/menu.js`
- `apps/api/static/js/menu-cart.js`
- `apps/api/static/js/crm-base.js`
- `apps/api/static/js/crm-login.js`
- `apps/api/static/js/crm-dashboard.js`

Esses arquivos são servidos por `/static/*` no FastAPI.
