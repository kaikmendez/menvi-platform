"""CLI administrativa da Menvi (operada pela M2 enquanto não há `apps/admin-web`).

Uso:
    python -m apps.api.admin_cli create-restaurant --slug cantina-ju --name "Cantina da Ju" \
        --owner-email ju@cantina.com --owner-name "Ju" --owner-password senha123

    python -m apps.api.admin_cli list-restaurants
    python -m apps.api.admin_cli reset-password --email ju@cantina.com --password nova123
    python -m apps.api.admin_cli change-plan --restaurant-id <id> --plan PRO --monthly-price 99.00
"""

from __future__ import annotations

import argparse
from decimal import Decimal

from sqlalchemy.orm import Session

from .core.db import SessionLocal
from .domain.billing.models import Subscription, SubscriptionPlan, SubscriptionStatus
from .domain.restaurants import service as restaurant_service
from .domain.restaurants.models import Restaurant
from .domain.users import service as user_service
from .domain.users.models import User, UserRole


def _cmd_create_restaurant(db: Session, args: argparse.Namespace) -> None:
    restaurant = restaurant_service.create_restaurant(db, slug=args.slug, name=args.name)
    owner = user_service.create_user(
        db,
        restaurant_id=restaurant.id,
        email=args.owner_email,
        name=args.owner_name,
        password=args.owner_password,
        role=UserRole.OWNER,
    )
    sub = Subscription(
        restaurant_id=restaurant.id,
        plan=SubscriptionPlan[args.plan],
        status=SubscriptionStatus.TRIALING,
    )
    db.add(sub)
    db.commit()
    print(f'[ok] restaurante criado: {restaurant.id} ({restaurant.slug})')
    print(f'[ok] owner:              {owner.email} (id={owner.id})')
    print(f'[ok] plano:              {sub.plan.value} ({sub.status.value})')


def _cmd_list_restaurants(db: Session, _: argparse.Namespace) -> None:
    rows = db.query(Restaurant).order_by(Restaurant.created_at.desc()).all()
    if not rows:
        print('(nenhum restaurante cadastrado)')
        return
    for r in rows:
        print(f'{r.id}\t{r.slug:32s}\t{r.name}\tis_open={r.is_open}')


def _cmd_reset_password(db: Session, args: argparse.Namespace) -> None:
    user = db.query(User).filter(User.email == args.email.lower()).first()
    if user is None:
        print(f'[erro] usuário {args.email} não encontrado')
        raise SystemExit(1)
    user_service.set_password(db, user_id=user.id, password=args.password)
    print(f'[ok] senha redefinida para {user.email}')


def _cmd_change_plan(db: Session, args: argparse.Namespace) -> None:
    sub = db.query(Subscription).filter(Subscription.restaurant_id == args.restaurant_id).first()
    if sub is None:
        sub = Subscription(restaurant_id=args.restaurant_id, plan=SubscriptionPlan[args.plan])
        db.add(sub)
    else:
        sub.plan = SubscriptionPlan[args.plan]
    if args.status:
        sub.status = SubscriptionStatus[args.status]
    if args.monthly_price is not None:
        sub.monthly_price = Decimal(str(args.monthly_price))
    db.commit()
    db.refresh(sub)
    print(f'[ok] plano atualizado: {sub.plan.value} ({sub.status.value}) R$ {sub.monthly_price}')


def main() -> None:
    parser = argparse.ArgumentParser(prog='apps.api.admin_cli', description='Menvi admin CLI')
    sub = parser.add_subparsers(dest='command', required=True)

    p_create = sub.add_parser('create-restaurant')
    p_create.add_argument('--slug', required=True)
    p_create.add_argument('--name', required=True)
    p_create.add_argument('--owner-email', required=True)
    p_create.add_argument('--owner-name', required=True)
    p_create.add_argument('--owner-password', required=True)
    p_create.add_argument('--plan', default='STARTER', choices=[p.value for p in SubscriptionPlan])
    p_create.set_defaults(fn=_cmd_create_restaurant)

    p_list = sub.add_parser('list-restaurants')
    p_list.set_defaults(fn=_cmd_list_restaurants)

    p_reset = sub.add_parser('reset-password')
    p_reset.add_argument('--email', required=True)
    p_reset.add_argument('--password', required=True)
    p_reset.set_defaults(fn=_cmd_reset_password)

    p_plan = sub.add_parser('change-plan')
    p_plan.add_argument('--restaurant-id', required=True)
    p_plan.add_argument('--plan', required=True, choices=[p.value for p in SubscriptionPlan])
    p_plan.add_argument('--status', choices=[s.value for s in SubscriptionStatus])
    p_plan.add_argument('--monthly-price', type=float)
    p_plan.set_defaults(fn=_cmd_change_plan)

    args = parser.parse_args()
    db = SessionLocal()
    try:
        args.fn(db, args)
    finally:
        db.close()


if __name__ == '__main__':
    main()
