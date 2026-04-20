from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import CurrentUser, get_current_user, require_manager_or_owner
from . import service
from .schemas import (
    CategoryCreateIn,
    CategoryOut,
    CategoryUpdateIn,
    ProductCreateIn,
    ProductOptionCreateIn,
    ProductOptionOut,
    ProductOptionUpdateIn,
    ProductOut,
    ProductUpdateIn,
)

categories_router = APIRouter(prefix='/crm/categories', tags=['menu'])
products_router = APIRouter(prefix='/crm/products', tags=['menu'])


# ---------- Categories ----------
@categories_router.get('', response_model=list[CategoryOut])
def list_categories(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CategoryOut]:
    return [CategoryOut.model_validate(c) for c in service.list_categories(db, current_user.restaurant_id)]


@categories_router.post('', response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> CategoryOut:
    category = service.create_category(db, restaurant_id=current_user.restaurant_id, **payload.model_dump())
    return CategoryOut.model_validate(category)


@categories_router.patch('/{category_id}', response_model=CategoryOut)
def update_category(
    category_id: str,
    payload: CategoryUpdateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> CategoryOut:
    category = service.update_category(
        db, current_user.restaurant_id, category_id, **payload.model_dump(exclude_unset=True)
    )
    return CategoryOut.model_validate(category)


@categories_router.delete('/{category_id}', status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_category(
    category_id: str,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> Response:
    service.delete_category(db, current_user.restaurant_id, category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Products ----------
@products_router.get('', response_model=list[ProductOut])
def list_products(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    return [ProductOut.model_validate(p) for p in service.list_products(db, current_user.restaurant_id)]


@products_router.get('/{product_id}', response_model=ProductOut)
def get_product(
    product_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductOut:
    return ProductOut.model_validate(service.get_product(db, current_user.restaurant_id, product_id))


@products_router.post('', response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> ProductOut:
    product = service.create_product(db, restaurant_id=current_user.restaurant_id, **payload.model_dump())
    return ProductOut.model_validate(product)


@products_router.patch('/{product_id}', response_model=ProductOut)
def update_product(
    product_id: str,
    payload: ProductUpdateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> ProductOut:
    product = service.update_product(
        db, current_user.restaurant_id, product_id, **payload.model_dump(exclude_unset=True)
    )
    return ProductOut.model_validate(product)


@products_router.delete('/{product_id}', status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_product(
    product_id: str,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> Response:
    service.delete_product(db, current_user.restaurant_id, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Options ----------
@products_router.post('/{product_id}/options', response_model=ProductOptionOut, status_code=status.HTTP_201_CREATED)
def add_option(
    product_id: str,
    payload: ProductOptionCreateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> ProductOptionOut:
    option = service.add_product_option(db, current_user.restaurant_id, product_id, **payload.model_dump())
    return ProductOptionOut.model_validate(option)


@products_router.patch('/{product_id}/options/{option_id}', response_model=ProductOptionOut)
def update_option(
    product_id: str,
    option_id: str,
    payload: ProductOptionUpdateIn,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> ProductOptionOut:
    option = service.update_product_option(
        db, current_user.restaurant_id, product_id, option_id, **payload.model_dump(exclude_unset=True)
    )
    return ProductOptionOut.model_validate(option)


@products_router.delete(
    '/{product_id}/options/{option_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_option(
    product_id: str,
    option_id: str,
    current_user: CurrentUser = Depends(require_manager_or_owner),
    db: Session = Depends(get_db),
) -> Response:
    service.delete_product_option(db, current_user.restaurant_id, product_id, option_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
