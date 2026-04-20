// Tipos compartilhados entre menu-web e crm-web.
// Espelham os schemas Pydantic de apps/api (ver apps/api/domain/**/schemas.py e
// apps/api/public/router.py). Em fases seguintes trocaremos este arquivo por geração
// automática via openapi-typescript a partir de apps/api/openapi.json.

export type UserRole = 'OWNER' | 'MANAGER' | 'ATTENDANT';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'PIX' | 'CARD' | 'CASH';

export type SubscriptionPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

/** ProductOption — adicional do produto. `price_delta` é string decimal. */
export interface ProductOption {
  id: string;
  name: string;
  price_delta: string;
  is_available: boolean;
  position: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  position: number;
  options: ProductOption[];
}

export interface PublicCategory {
  id: string;
  name: string;
  position: number;
  products: Product[];
}

/** Resposta achatada de `GET /public/menu/{slug}`. */
export interface PublicMenu {
  restaurant_id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_open: boolean;
  delivery_fee: string;
  min_order_amount: string;
  accepts_pix: boolean;
  accepts_card: boolean;
  accepts_cash: boolean;
  categories: PublicCategory[];
}

export interface OrderItemOption {
  id: string;
  product_option_id: string;
  name: string;
  price_delta: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: string;
  quantity: number;
  total: string;
  notes: string | null;
  options: OrderItemOption[];
}

export interface OrderCustomerMini {
  id: string;
  name: string;
  phone: string;
}

export interface OrderEvent {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_user_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  code: number;
  restaurant_id: string;
  customer: OrderCustomerMini;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: string;
  delivery_fee: string;
  total: string;
  notes: string | null;
  items: OrderItem[];
  events: OrderEvent[];
  created_at: string;
  updated_at: string;
}

/** Visão pública reduzida (`GET /public/orders/{id}`). */
export interface PublicOrder {
  id: string;
  code: number;
  status: OrderStatus;
  total: string;
  created_at: string;
}

export interface OrderCreateItem {
  product_id: string;
  quantity: number;
  notes?: string | null;
  option_ids?: string[];
}

export interface OrderCreatePayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_address?: string | null;
  payment_method: PaymentMethod;
  notes?: string | null;
  items: OrderCreateItem[];
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface CurrentUserOut {
  id: string;
  restaurant_id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface RealtimeEvent<T = unknown> {
  event: 'order.created' | 'order.status_changed';
  payload: T;
}
