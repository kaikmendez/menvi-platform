from fastapi import APIRouter, Depends
from ..deps import get_current_user

router = APIRouter(prefix='/customers', tags=['customers'])


@router.get('')
def list_items(_: dict = Depends(get_current_user)):
    return {'module': 'customers', 'data': []}
