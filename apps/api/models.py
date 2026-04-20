import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class UserRole(str, enum.Enum):
    OWNER = 'OWNER'
    MANAGER = 'MANAGER'
    ATTENDANT = 'ATTENDANT'


class OrderStatus(str, enum.Enum):
    PENDING = 'PENDING'
    CONFIRMED = 'CONFIRMED'
    PREPARING = 'PREPARING'
    READY = 'READY'
    DELIVERED = 'DELIVERED'
    CANCELLED = 'CANCELLED'


class PaymentMethod(str, enum.Enum):
    PIX = 'PIX'
    CREDIT_CARD = 'CREDIT_CARD'
    DEBIT_CARD = 'DEBIT_CARD'
    CASH = 'CASH'


class Restaurant(Base):
    __tablename__ = 'restaurants'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[list['User']] = relationship(back_populates='restaurant', cascade='all, delete-orphan')
    categories: Mapped[list['Category']] = relationship(back_populates='restaurant', cascade='all, delete-orphan')
    products: Mapped[list['Product']] = relationship(back_populates='restaurant', cascade='all, delete-orphan')
    customers: Mapped[list['Customer']] = relationship(back_populates='restaurant', cascade='all, delete-orphan')
    orders: Mapped[list['Order']] = relationship(back_populates='restaurant', cascade='all, delete-orphan')


class User(Base):
    __tablename__ = 'users'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey('restaurants.id', ondelete='CASCADE'))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.ATTENDANT)

    restaurant: Mapped['Restaurant'] = relationship(back_populates='users')


class Customer(Base):
    __tablename__ = 'customers'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey('restaurants.id', ondelete='CASCADE'))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    restaurant: Mapped['Restaurant'] = relationship(back_populates='customers')
    orders: Mapped[list['Order']] = relationship(back_populates='customer')


class Category(Base):
    __tablename__ = 'categories'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey('restaurants.id', ondelete='CASCADE'))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    restaurant: Mapped['Restaurant'] = relationship(back_populates='categories')
    products: Mapped[list['Product']] = relationship(back_populates='category')


class Product(Base):
    __tablename__ = 'products'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey('restaurants.id', ondelete='CASCADE'))
    category_id: Mapped[str] = mapped_column(ForeignKey('categories.id', ondelete='RESTRICT'))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    restaurant: Mapped['Restaurant'] = relationship(back_populates='products')
    category: Mapped['Category'] = relationship(back_populates='products')
    options: Mapped[list['ProductOption']] = relationship(back_populates='product', cascade='all, delete-orphan')
    order_items: Mapped[list['OrderItem']] = relationship(back_populates='product')


class ProductOption(Base):
    __tablename__ = 'product_options'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    product_id: Mapped[str] = mapped_column(ForeignKey('products.id', ondelete='CASCADE'))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price_impact: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)

    product: Mapped['Product'] = relationship(back_populates='options')
    item_links: Mapped[list['OrderItemOption']] = relationship(back_populates='product_option')


class Order(Base):
    __tablename__ = 'orders'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey('restaurants.id', ondelete='CASCADE'))
    customer_id: Mapped[str] = mapped_column(ForeignKey('customers.id', ondelete='RESTRICT'))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    restaurant: Mapped['Restaurant'] = relationship(back_populates='orders')
    customer: Mapped['Customer'] = relationship(back_populates='orders')
    items: Mapped[list['OrderItem']] = relationship(back_populates='order', cascade='all, delete-orphan')


class OrderItem(Base):
    __tablename__ = 'order_items'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey('orders.id', ondelete='CASCADE'))
    product_id: Mapped[str] = mapped_column(ForeignKey('products.id', ondelete='RESTRICT'))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped['Order'] = relationship(back_populates='items')
    product: Mapped['Product'] = relationship(back_populates='order_items')
    options: Mapped[list['OrderItemOption']] = relationship(back_populates='order_item', cascade='all, delete-orphan')


class OrderItemOption(Base):
    __tablename__ = 'order_item_options'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    order_item_id: Mapped[str] = mapped_column(ForeignKey('order_items.id', ondelete='CASCADE'))
    product_option_id: Mapped[str] = mapped_column(ForeignKey('product_options.id', ondelete='RESTRICT'))

    order_item: Mapped['OrderItem'] = relationship(back_populates='options')
    product_option: Mapped['ProductOption'] = relationship(back_populates='item_links')


class Payment(Base):
    __tablename__ = 'payments'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey('orders.id', ondelete='CASCADE'), unique=True)
    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)


class RestaurantSettings(Base):
    __tablename__ = 'restaurant_settings'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey('restaurants.id', ondelete='CASCADE'), unique=True)
    accepts_orders: Mapped[bool] = mapped_column(Boolean, default=True)
    delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    min_order_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
