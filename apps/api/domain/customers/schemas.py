from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone: str
    email: EmailStr | None
    address: str | None


class CustomerCreateIn(BaseModel):
    name: str
    phone: str
    email: EmailStr | None = None
    address: str | None = None


class CustomerUpdateIn(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
