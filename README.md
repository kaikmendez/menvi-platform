# Menvi — plataforma SaaS para restaurantes parceiros

Monorepo da **Menvi** (produto da **M2 Solutions**). Objetivo: cardápio digital voltado à
conversão para o cliente final + CRM operacional para o restaurante parceiro, tudo alimentado
por uma API única como fonte de verdade.

> **Escopo atual:** backend completo (`apps/api`) + scaffold monorepo frontend (`apps/menu-web`, `apps/crm-web`, `packages/{ui,types,utils,config}`) — Fases 1 e 2.
> Funcionalidade do menu-web e crm-web (checkout, Kanban realtime) entram nas Fases 3 e 4.

---

## Arquitetura

```
menvi-platform/
├─ apps/
│  ├─ api/                  # FastAPI — fonte de verdade
│  │  ├─ core/              # config, db, security, deps, realtime, logging, errors
│  │  ├─ domain/            # domínios (auth, users, restaurants, menu, customers,
│  │  │                     #   orders, payments, billing, whatsapp, audit)
│  │  ├─ public/            # endpoints sem auth (cardápio público + checkout)
│  │  ├─ admin/             # endpoints `/admin/*` protegidos por token
│  │  ├─ seed.py            # `python -m apps.api.seed`
│  │  ├─ admin_cli.py       # `python -m apps.api.admin_cli ...`
│  │  └─ main.py            # wiring FastAPI
│  ├─ menu-web/             # Next.js 15 — cardápio público (cliente final)
│  └─ crm-web/              # Next.js 15 — painel do restaurante (login + pedidos)
├─ packages/
│  ├─ config/               # tsconfig, tailwind preset, eslint flat config
│  ├─ types/                # tipos compartilhados (mirror dos schemas da API)
│  ├─ utils/                # formatadores (BRL, telefone, status de pedido)
│  └─ ui/                   # componentes shadcn-style (Button, Card, Badge, …)
├─ alembic/                 # migrations (fonte de verdade = Base.metadata)
├─ infra/                   # docker-compose, Dockerfile.api
└─ tests/                   # pytest (unit + integration)
```

Princípios:
- **Router finas → services puros → repositories**. Router não conhece SQLAlchemy.
- **Multi-tenant por `restaurant_id`**. Todas as queries do CRM filtram por `current_user.restaurant_id`.
- **Status do pedido como máquina de estados** com transições válidas em `orders/service.py`.
- **ULID** como PK (ordenável por tempo).
- **Alembic** é o único caminho de mudança de schema — nada de `create_all` em produção.
- **Realtime** via WebSocket (`/crm/orders/ws?token=...`) — pedido novo aparece no CRM em tempo real.

---

## Como subir o projeto localmente

### 1. Postgres + Redis (Docker)
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Python 3.11+ e dependências
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements-dev.txt
pre-commit install
```

### 3. Variáveis de ambiente
```bash
cp .env.example .env
# edite conforme necessário — defaults funcionam com o docker-compose
```

### 4. Aplicar migrations e semear dados
```bash
alembic upgrade head
python -m apps.api.seed
```

Isso cria o restaurante demo + usuário OWNER:
- Login CRM: `admin@menvi.com` / `123456`
- Slug do menu: `restaurante-demo`

### 5. Subir a API
```bash
uvicorn apps.api.main:app --reload --port 8000
```

- Docs (Swagger): http://localhost:8000/docs
- Menu público: http://localhost:8000/public/menu/restaurante-demo

---

## Endpoints principais

### Público (sem auth — consumido pelo `menu-web`)
- `GET  /public/menu/{slug}` — cardápio inteiro de um restaurante
- `POST /public/restaurants/{slug}/orders` — checkout do cliente final
- `GET  /public/orders/{order_id}` — acompanhamento do pedido pelo cliente final

### CRM (auth = `Authorization: Bearer <access_token>`)
- `POST /auth/login`, `POST /auth/refresh`
- `GET /crm/users/me`, `GET/POST/PATCH /crm/users/...`
- `GET/PATCH /crm/restaurant`, `GET/PATCH /crm/restaurant/settings`
- `GET/POST/PATCH/DELETE /crm/categories/...`
- `GET/POST/PATCH/DELETE /crm/products/...` (+ `/options`)
- `GET/POST/PATCH /crm/customers/...`
- `GET /crm/orders`, `GET /crm/orders/{id}`, `POST /crm/orders/{id}/status`
- `WS  /crm/orders/ws?token=<access_token>` — eventos `order.created` e `order.status_changed`
- `GET /crm/subscription`

### Admin (`X-Admin-Token: <ADMIN_API_TOKEN>` — usado pela M2 enquanto não há `admin-web`)
- `POST /admin/restaurants` — cria restaurante + OWNER + subscription TRIALING
- `GET  /admin/restaurants`
- `POST /admin/restaurants/{id}/plan`
- `POST /admin/reset-password`

---

## CLI administrativa

Enquanto `apps/admin-web` não existe, a M2 opera pela CLI:

```bash
python -m apps.api.admin_cli create-restaurant \
  --slug cantina-ju --name "Cantina da Ju" \
  --owner-email ju@cantina.com --owner-name "Ju" --owner-password senha123

python -m apps.api.admin_cli list-restaurants
python -m apps.api.admin_cli reset-password --email ju@cantina.com --password nova123
python -m apps.api.admin_cli change-plan --restaurant-id <id> --plan PRO --monthly-price 99.00
```

---

## Qualidade

```bash
# lint + format check
ruff check .
ruff format --check .
black --check .

# type check
mypy apps/api

# testes (exige Postgres rodando)
DATABASE_URL=postgresql+psycopg://menvi:menvi@localhost:5432/menvi_test alembic upgrade head
pytest
```

Pre-commit aplica ruff/black/ruff-format automaticamente em cada commit.

---

## Migrations

Schema é versionado em `alembic/versions/`. Fluxo:

```bash
# gerar nova migration a partir da mudança nos modelos
alembic revision --autogenerate -m "add customer_tags"

# aplicar
alembic upgrade head

# reverter uma
alembic downgrade -1
```

---

## Frontend (Fase 2 — scaffold)

### Requisitos
- Node.js 20+ e [pnpm](https://pnpm.io) 9.15.1 (`npm i -g pnpm@9.15.1`).

### Instalação e execução
```bash
pnpm install                 # instala tudo do monorepo
pnpm dev                     # roda menu-web (3000) e crm-web (3001) em paralelo via turbo

# individualmente:
pnpm --filter @menvi/menu-web dev    # http://localhost:3000
pnpm --filter @menvi/crm-web dev     # http://localhost:3001
```

As duas apps apontam para a API em `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8000`).
Copie `.env.example` para `.env.local` dentro de cada app se quiser sobrescrever.

### Checks
```bash
pnpm typecheck               # tsc --noEmit em todos os workspaces
pnpm lint                    # eslint flat config + Next plugin
pnpm build                   # next build em menu-web e crm-web
```

### Roadmap (fora do escopo da Fase 2)

- **Fase 3** — `apps/menu-web` funcional: carrinho, checkout, Pix real via Mercado Pago.
- **Fase 4** — `apps/crm-web` funcional: Kanban realtime (WebSocket), som, RBAC, relatórios.
- **Fase 5** — WhatsApp Business Cloud API + Stripe Billing.
- **Fase 6** — observabilidade (Sentry/PostHog/OTel), E2E (Playwright), deploy staging + produção.

> `apps/admin-web` (ERP interno da M2) **fica fora deste monorepo** — projeto à parte.
> A API já expõe `/admin/*` e a CLI `admin_cli.py` cobre o que a M2 precisa no dia-a-dia.
