from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from .models import OrderStatus, PaymentMethod


class OrderItemOptionIn(BaseModel):
    product_option_id: str


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)
    notes: str | None = None
    option_ids: list[str] = Field(default_factory=list)


class OrderCreateIn(BaseModel):
    """Payload de checkout do `menu-web`. Sem auth — vem do cliente final."""

    customer_name: str = Field(min_length=1, max_length=160)
    customer_phone: str = Field(min_length=8, max_length=32)
    customer_email: str | None = None
    customer_address: str | None = None
    payment_method: PaymentMethod
    notes: str | None = None
    items: list[OrderItemIn] = Field(min_length=1)


class OrderItemOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_option_id: str
    name: str
    price_delta: Decimal


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str
    product_name: str
    unit_price: Decimal
    quantity: int
    total: Decimal
    notes: str | None
    options: list[OrderItemOptionOut]


class OrderEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    from_status: OrderStatus | None
    to_status: OrderStatus
    actor_user_id: str | None
    note: str | None
    created_at: datetime


class OrderCustomerMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    phone: str
    address: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: int
    restaurant_id: str
    customer: OrderCustomerMini
    status: OrderStatus
    payment_method: PaymentMethod
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal
    notes: str | None
    items: list[OrderItemOut]
    events: list[OrderEventOut]
    created_at: datetime
    updated_at: datetime


class OrderStatusUpdateIn(BaseModel):
    status: OrderStatus
    note: str | None = None


class PublicOrderOut(BaseModel):
    """Visão pública (cliente final acompanha seu pedido pelo ID)."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    code: int
    status: OrderStatus
    total: Decimal
    created_at: datetime
