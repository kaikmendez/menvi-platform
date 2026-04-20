from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .admin.router import router as admin_router
from .core.config import settings
from .core.errors import install_exception_handlers
from .core.logging import configure_logging
from .core.realtime import hub
from .domain.auth.router import router as auth_router
from .domain.billing.router import router as billing_router
from .domain.customers.router import router as customers_router
from .domain.menu.router import categories_router, products_router
from .domain.orders.router import router as orders_router
from .domain.restaurants.router import router as restaurant_router
from .domain.users.router import router as users_router
from .public.router import router as public_router

configure_logging('INFO')

app = FastAPI(
    title='Menvi API',
    version='0.1.0',
    description='Menvi — plataforma SaaS para restaurantes parceiros (M2 Solutions).',
)

install_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
async def _on_startup() -> None:
    # Registra o event loop principal para que handlers síncronos consigam
    # publicar eventos em WebSockets via `hub.publish_sync`.
    hub.bind_loop(asyncio.get_running_loop())


@app.get('/health', tags=['meta'])
def health() -> dict[str, str]:
    return {'status': 'ok', 'env': settings.api_env}


# Públicos (cliente final)
app.include_router(public_router)

# CRM (restaurante)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(restaurant_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(billing_router)

# Admin (M2)
app.include_router(admin_router)
