from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ---------- Category ----------
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    position: int
    is_active: bool


class CategoryCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    position: int = 0
    is_active: bool = True


class CategoryUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    position: int | None = None
    is_active: bool | None = None


# ---------- Product Option ----------
class ProductOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    price_delta: Decimal
    is_available: bool
    position: int


class ProductOptionCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    price_delta: Decimal = Decimal('0')
    is_available: bool = True
    position: int = 0


class ProductOptionUpdateIn(BaseModel):
    name: str | None = None
    price_delta: Decimal | None = None
    is_available: bool | None = None
    position: int | None = None


# ---------- Product ----------
class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category_id: str
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    position: int
    options: list[ProductOptionOut] = []


class ProductCreateIn(BaseModel):
    category_id: str
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    price: Decimal = Field(ge=Decimal('0'))
    image_url: str | None = None
    is_available: bool = True
    position: int = 0


class ProductUpdateIn(BaseModel):
    category_id: str | None = None
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    image_url: str | None = None
    is_available: bool | None = None
    position: int | None = None


# ---------- Público (menu agregado) ----------
class PublicCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    position: int
    products: list[ProductOut] = []


class PublicMenuOut(BaseModel):
    restaurant_id: str
    slug: str
    name: str
    description: str | None
    logo_url: str | None
    cover_url: str | None
    is_open: bool
    delivery_fee: Decimal
    min_order_amount: Decimal
    accepts_pix: bool
    accepts_card: bool
    accepts_cash: bool
    categories: list[PublicCategoryOut]
