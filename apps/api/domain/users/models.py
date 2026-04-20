from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...core.db import Base
from ...core.ids import new_id
from ..shared.mixins import TimestampMixin

if TYPE_CHECKING:
    from ..restaurants.models import Restaurant


class UserRole(str, enum.Enum):
    OWNER = 'OWNER'
    MANAGER = 'MANAGER'
    ATTENDANT = 'ATTENDANT'


class User(Base, TimestampMixin):
    __tablename__ = 'users'

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_id)
    restaurant_id: Mapped[str] = mapped_column(String(26), ForeignKey('restaurants.id', ondelete='CASCADE'), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name='user_role'), default=UserRole.ATTENDANT)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    restaurant: Mapped[Restaurant] = relationship(back_populates='users')
