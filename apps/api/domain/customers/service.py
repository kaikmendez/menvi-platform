from __future__ import annotations

from sqlalchemy.orm import Session

from ...core.errors import NotFound
from .models import Customer


def list_customers(db: Session, restaurant_id: str) -> list[Customer]:
    return db.query(Customer).filter(Customer.restaurant_id == restaurant_id).order_by(Customer.created_at.desc()).all()


def get_customer(db: Session, restaurant_id: str, customer_id: str) -> Customer:
    c = db.query(Customer).filter(Customer.id == customer_id, Customer.restaurant_id == restaurant_id).first()
    if c is None:
        raise NotFound('Cliente não encontrado')
    return c


def get_or_create_by_phone(
    db: Session,
    *,
    restaurant_id: str,
    name: str,
    phone: str,
    email: str | None = None,
    address: str | None = None,
) -> Customer:
    existing = db.query(Customer).filter(Customer.restaurant_id == restaurant_id, Customer.phone == phone).first()
    if existing is not None:
        if name and existing.name != name:
            existing.name = name
        if address and existing.address != address:
            existing.address = address
        if email and existing.email != email:
            existing.email = email
        db.commit()
        db.refresh(existing)
        return existing
    customer = Customer(restaurant_id=restaurant_id, name=name.strip(), phone=phone, email=email, address=address)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, restaurant_id: str, customer_id: str, **fields: object) -> Customer:
    customer = get_customer(db, restaurant_id, customer_id)
    for k, v in fields.items():
        if v is None:
            continue
        setattr(customer, k, v)
    db.commit()
    db.refresh(customer)
    return customer
