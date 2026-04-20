from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class OrderCustomerIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=20)


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=30)
    option_ids: list[str] = Field(default_factory=list)
    note: str | None = Field(default=None, max_length=500)


class CreateOrderIn(BaseModel):
    restaurant_slug: str
    customer: OrderCustomerIn
    items: list[OrderItemIn] = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=1000)


class OrderItemOut(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    line_total: float
    option_names: list[str]
    note: str | None


class OrderOut(BaseModel):
    id: str
    code: str
    restaurant_id: str
    customer_id: str
    customer_name: str
    customer_phone: str
    status: str
    total_amount: float
    notes: str | None
    created_at: datetime
    items: list[OrderItemOut]


class UpdateOrderStatusIn(BaseModel):
    status: str
