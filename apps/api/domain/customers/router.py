from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import CurrentUser, get_current_user, require_manager_or_owner
from . import service
from .schemas import CustomerCreateIn, CustomerOut, CustomerUpdateIn

router = APIRouter(prefix='/crm/customers', tags=['customers'])


@router.get('', response_model=list[CustomerOut])
def list_customers(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CustomerOut]:
    return [CustomerOut.model_validate(c) for c in service.list_customers(db, current_user.restaurant_id)]


@router.get('/{customer_id}', response_model=CustomerOut)
def get_customer(
    customer_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerOut:
    return CustomerOut.model_validate(service.get_customer(db, current_user.restaurant_id, customer_id))


@router.post('', response_model=CustomerOut, status_code=201)
def create_customer(
    payload: CustomerCreateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> CustomerOut:
    customer = service.get_or_create_by_phone(
        db,
        restaurant_id=current_user.restaurant_id,
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
    )
    return CustomerOut.model_validate(customer)


@router.patch('/{customer_id}', response_model=CustomerOut)
def update_customer(
    customer_id: str,
    payload: CustomerUpdateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> CustomerOut:
    customer = service.update_customer(
        db, current_user.restaurant_id, customer_id, **payload.model_dump(exclude_unset=True)
    )
    return CustomerOut.model_validate(customer)
