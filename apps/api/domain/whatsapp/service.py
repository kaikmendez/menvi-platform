from __future__ import annotations

from ...core.config import settings
from ...core.logging import get_logger

log = get_logger(__name__)


def send_order_status_template(*, phone: str, order_code: int, status: str) -> None:
    """Envia template de status do pedido via Meta WhatsApp Cloud API.
    Stub atual: apenas loga. Implementação real entra na Fase 5.
    """
    if not settings.whatsapp_access_token or not settings.whatsapp_phone_number_id:
        log.info('whatsapp.template.skipped', phone=phone, order_code=order_code, status=status, reason='no-config')
        return
    log.info('whatsapp.template.sent', phone=phone, order_code=order_code, status=status)
