from __future__ import annotations

import asyncio
import contextlib
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class RealtimeHub:
    """Hub simples de WebSockets por restaurante. Cada sessão do CRM abre uma conexão
    e ouve eventos de pedidos do seu próprio `restaurant_id`.

    Para escalar para múltiplas instâncias, trocar por Redis pub/sub mantendo a mesma
    interface pública (`publish`, `subscribe`, `unsubscribe`).
    """

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Registra o loop principal (chamado pelo startup do FastAPI) para
        que `publish_sync` possa agendar eventos a partir de handlers síncronos."""
        self._loop = loop

    async def subscribe(self, restaurant_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[restaurant_id].add(websocket)

    async def unsubscribe(self, restaurant_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[restaurant_id].discard(websocket)
            if not self._connections[restaurant_id]:
                self._connections.pop(restaurant_id, None)

    async def publish(self, restaurant_id: str, event: str, payload: dict[str, Any]) -> None:
        message = {'event': event, 'payload': payload}
        async with self._lock:
            targets = list(self._connections.get(restaurant_id, set()))
        for ws in targets:
            try:
                await ws.send_json(message)
            except Exception:
                # conexão caiu — dropa silenciosamente; próximo ciclo removerá
                await self.unsubscribe(restaurant_id, ws)

    def publish_sync(self, restaurant_id: str, event: str, payload: dict[str, Any]) -> None:
        """Agenda `publish` para execução no loop principal a partir de um contexto
        síncrono (handler FastAPI `def`). Silencioso se o loop ainda não foi
        registrado (testes, boot, etc.)."""
        if self._loop is None or not self._connections.get(restaurant_id):
            return
        with contextlib.suppress(RuntimeError):
            asyncio.run_coroutine_threadsafe(self.publish(restaurant_id, event, payload), self._loop)


hub = RealtimeHub()
