// Tipos compartilhados entre menu-web e crm-web.
// Espelham os schemas Pydantic de apps/api. Em fases seguintes trocaremos
// este arquivo por geração automática via openapi-typescript a partir de
// apps/api/openapi.json.

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

export interface RestaurantSettings {
  delivery_fee: string;
  min_order_amount: string;
  accepts_pix: boolean;
  accepts_card: boolean;
  accepts_cash: boolean;
  opening_hours: string | null;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  whatsapp_phone: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_open: boolean;
  settings: RestaurantSettings;
}

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

export interface Category {
  id: string;
  name: string;
  position: number;
  is_active: boolean;
  products: Product[];
}

export interface PublicMenu {
  restaurant: Restaurant;
  categories: Category[];
}

export interface OrderItemOption {
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

export interface Order {
  id: string;
  code: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: string;
  delivery_fee: string;
  total: string;
  notes: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderCreateItemOption {
  product_option_id: string;
}

export interface OrderCreateItem {
  product_id: string;
  quantity: number;
  notes?: string | null;
  options?: OrderCreateItemOption[];
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
