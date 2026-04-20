from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from .db import Base, SessionLocal, engine
from .models import Customer, Order, OrderStatus
from .routers import auth, categories, customers, orders, products, restaurants

app = FastAPI(title='Menvi Platform API (Python)')
app.mount('/static', StaticFiles(directory=str(Path(__file__).parent / 'static')), name='static')

Base.metadata.create_all(bind=engine)

templates = Jinja2Templates(directory=str(Path(__file__).parent / 'templates'))

app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(customers.router)


@app.get('/', response_class=HTMLResponse)
def root(request: Request):
    return templates.TemplateResponse('menu/home.html', {'request': request})


@app.get('/menu/categories', response_class=HTMLResponse)
def menu_categories(request: Request):
    return templates.TemplateResponse('menu/categories.html', {'request': request})


@app.get('/menu/products', response_class=HTMLResponse)
def menu_products(request: Request):
    return templates.TemplateResponse('menu/products.html', {'request': request})


@app.get('/menu/product/{product_id}', response_class=HTMLResponse)
def menu_product_detail(request: Request, product_id: str):
    return templates.TemplateResponse('menu/product.html', {'request': request, 'product_id': product_id})


@app.get('/menu/cart', response_class=HTMLResponse)
def menu_cart(request: Request):
    return templates.TemplateResponse('menu/cart.html', {'request': request})


@app.get('/crm/login', response_class=HTMLResponse)
def crm_login(request: Request):
    return templates.TemplateResponse('crm/login.html', {'request': request})


@app.get('/crm/dashboard', response_class=HTMLResponse)
def crm_dashboard(request: Request):
    db: Session = SessionLocal()
    try:
        orders_data = db.query(Order).order_by(Order.id.desc()).all()
        customers_map = {c.id: c for c in db.query(Customer).all()}

        counts = {
            'total': len(orders_data),
            'pending': len([o for o in orders_data if o.status == OrderStatus.PENDING]),
            'processing': len([o for o in orders_data if o.status in [OrderStatus.CONFIRMED, OrderStatus.PREPARING]]),
        }

        view_orders = [
            {
                'id': o.id,
                'code': o.id[:8],
                'customer_name': customers_map.get(o.customer_id).name if customers_map.get(o.customer_id) else 'Cliente',
                'customer_phone': customers_map.get(o.customer_id).phone if customers_map.get(o.customer_id) else '-',
                'status': o.status.value,
                'total_amount': float(o.total_amount),
                'notes': o.notes or ''
            }
            for o in orders_data
        ]

        return templates.TemplateResponse('crm/dashboard.html', {
            'request': request,
            'counts': counts,
            'orders': view_orders
        })
    finally:
        db.close()


@app.get('/crm/orders', response_class=HTMLResponse)
def crm_orders(request: Request):
    return templates.TemplateResponse('crm/orders.html', {'request': request})


@app.get('/crm/customers', response_class=HTMLResponse)
def crm_customers(request: Request):
    return templates.TemplateResponse('crm/customers.html', {'request': request})


@app.get('/crm/products', response_class=HTMLResponse)
def crm_products(request: Request):
    return templates.TemplateResponse('crm/products.html', {'request': request})
