from fastapi import APIRouter, Depends
from ..deps import get_current_user

router = APIRouter(prefix='/orders', tags=['orders'])


@router.get('')
def list_items(_: dict = Depends(get_current_user)):
    return {'module': 'orders', 'data': []}
