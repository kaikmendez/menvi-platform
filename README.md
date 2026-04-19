# Menvi Platform

Plataforma inicial da **M2 Solutions** para gestão de restaurantes, com foco em:

- **Menu digital** para cliente final (`apps/menu-web`)
- **CRM do restaurante** para pedidos/clientes (`apps/crm-web`)
- **API central** para domínio e integrações (`apps/api`)

## Visão de arquitetura

O projeto foi iniciado como **monorepo** com `pnpm workspaces` + `Turborepo`, visando escalabilidade para evolução em SaaS multi-tenant.

### Decisões iniciais

- Monorepo para compartilhamento de UI, tipos e utilitários.
- API com NestJS modular (auth + domínios principais), Prisma e PostgreSQL.
- Apps web em Next.js com Tailwind e componentes compartilhados.
- Redis + BullMQ preparados para filas assíncronas.
- Estrutura simples no primeiro commit, com base extensível.

## Stack

- **Monorepo:** pnpm workspaces, Turborepo
- **Linguagem:** TypeScript
- **Frontend:** Next.js, Tailwind CSS, shadcn/ui style
- **Backend:** NestJS
- **DB:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT
- **Fila/Cache:** Redis + BullMQ (base preparada)
- **Tempo real CRM:** Socket.IO (gateway inicial)
- **Infra local:** Docker Compose

## Estrutura de pastas

```text
apps/
  menu-web/
  crm-web/
  api/
packages/
  ui/
  types/
  utils/
  config/
```

## Como rodar localmente

### 1) Subir serviços de infraestrutura

```bash
docker compose up -d
```

Serviços:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 2) Instalar dependências

```bash
pnpm install
```

### 3) Configurar variáveis da API

```bash
cp apps/api/.env.example apps/api/.env
```

### 4) Rodar migração Prisma

```bash
pnpm --filter @menvi/api prisma:generate
pnpm --filter @menvi/api prisma:migrate:dev --name init
```

### 5) Rodar tudo com Turbo

```bash
pnpm dev
```

Apps:
- menu-web: http://localhost:3000
- crm-web: http://localhost:3001
- api: http://localhost:3002


## Publicação no branch `main`

Este scaffold foi criado no branch de trabalho (feature branch). Para disponibilizar no `main`, é necessário:

1. Garantir que o branch exista no remoto (`origin`);
2. Abrir e aprovar o Pull Request desta branch para `main`; ou
3. Fazer `cherry-pick` do commit no `main` em ambientes sem PR automatizado.

Se você **não localizar o branch no GitHub** (apenas `main` aparece), publique o branch local:

```bash
git checkout work
git push -u origin work
```

Depois, abra o PR `work` -> `main`.

Exemplo de cherry-pick direto no `main`:

```bash
git checkout main
git cherry-pick 7538f9e
```

## Scripts úteis

- `pnpm dev` – sobe apps em desenvolvimento
- `pnpm build` – build de todos os pacotes/apps
- `pnpm lint` – lint dos workspaces
- `pnpm typecheck` – checagem de tipos

## Próximos focos sugeridos

1. Multi-tenant por `restaurantId` + isolamento de dados
2. Auth robusta (refresh token, RBAC, guards por domínio)
3. Fluxo real de pedido fim a fim (menu -> checkout -> CRM)
4. Integração WhatsApp Business API
5. Filas BullMQ para notificações/eventos
6. Gateway Socket.IO para eventos de pedido em tempo real
7. Cobertura de testes (unit + e2e)
8. Observabilidade (logs estruturados, métricas)
9. CI/CD com validações de workspace
10. Hardening de segurança e LGPD
