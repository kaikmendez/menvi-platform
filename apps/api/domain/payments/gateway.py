from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from ...core.ids import new_id


@dataclass(frozen=True)
class PaymentIntent:
    provider: str
    provider_id: str
    qr_code: str | None
    raw_response: str


class PaymentGateway(Protocol):
    """Interface mínima de gateway de pagamento. Implementações: mock, mercadopago, pagarme."""

    name: str

    def create_pix_intent(self, *, order_id: str, amount: Decimal, customer_name: str) -> PaymentIntent: ...


class MockGateway:
    """Gateway usado em dev/teste. Gera QR code fake determinístico."""

    name = 'mock'

    def create_pix_intent(self, *, order_id: str, amount: Decimal, customer_name: str) -> PaymentIntent:
        fake_id = new_id()
        qr = f'mock-pix|{order_id}|{amount}|{fake_id}'
        return PaymentIntent(
            provider=self.name,
            provider_id=fake_id,
            qr_code=qr,
            raw_response='{"ok": true, "mock": true}',
        )


def get_gateway() -> PaymentGateway:
    # Futuramente lê `settings.payments_provider` e decide. Por ora sempre mock.
    return MockGateway()
