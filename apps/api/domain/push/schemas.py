from __future__ import annotations

from pydantic import BaseModel, Field


class PushKeys(BaseModel):
    p256dh: str = Field(min_length=1, max_length=255)
    auth: str = Field(min_length=1, max_length=255)


class PushSubscriptionIn(BaseModel):
    endpoint: str = Field(min_length=1)
    keys: PushKeys


class PushSubscriptionOut(BaseModel):
    ok: bool = True


class VapidPublicKeyOut(BaseModel):
    public_key: str | None
