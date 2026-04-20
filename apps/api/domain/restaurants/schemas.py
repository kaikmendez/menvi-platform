from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class RestaurantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    description: str | None
    whatsapp_phone: str | None
    logo_url: str | None
    cover_url: str | None
    is_open: bool


class RestaurantUpdateIn(BaseModel):
    name: str | None = None
    description: str | None = None
    whatsapp_phone: str | None = None
    logo_url: str | None = None
    cover_url: str | None = None
    is_open: bool | None = None


class RestaurantSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    delivery_fee: Decimal
    min_order_amount: Decimal
    accepts_pix: bool
    accepts_card: bool
    accepts_cash: bool
    opening_hours: str | None


class RestaurantSettingsUpdateIn(BaseModel):
    delivery_fee: Decimal | None = None
    min_order_amount: Decimal | None = None
    accepts_pix: bool | None = None
    accepts_card: bool | None = None
    accepts_cash: bool | None = None
    opening_hours: str | None = None
