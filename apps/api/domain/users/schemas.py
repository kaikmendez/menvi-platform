from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from .models import UserRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    restaurant_id: str
    email: EmailStr
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class UserInviteIn(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.ATTENDANT


class UserUpdateIn(BaseModel):
    name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class PasswordSetIn(BaseModel):
    password: str
