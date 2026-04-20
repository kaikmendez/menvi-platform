import type {
  CurrentUserOut,
  Order,
  OrderStatus,
  OrderStatusUpdatePayload,
  Restaurant,
  RestaurantSettings,
  RestaurantUpdatePayload,
  TokenPair,
} from '@menvi/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return (await res.json()) as T;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function login(email: string, password: string): Promise<TokenPair> {
  return request<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token: string): Promise<CurrentUserOut> {
  return request<CurrentUserOut>('/crm/users/me', { headers: authHeaders(token) });
}

export async function getRestaurant(token: string): Promise<Restaurant> {
  return request<Restaurant>('/crm/restaurant', { headers: authHeaders(token) });
}

export async function updateRestaurant(
  token: string,
  payload: RestaurantUpdatePayload,
): Promise<Restaurant> {
  return request<Restaurant>('/crm/restaurant', {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function getRestaurantSettings(token: string): Promise<RestaurantSettings> {
  return request<RestaurantSettings>('/crm/restaurant/settings', {
    headers: authHeaders(token),
  });
}

interface ListOrdersParams {
  status?: OrderStatus;
  limit?: number;
}

export async function listOrders(token: string, params: ListOrdersParams = {}): Promise<Order[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<Order[]>(`/crm/orders${suffix}`, { headers: authHeaders(token) });
}

export async function getOrder(token: string, orderId: string): Promise<Order> {
  return request<Order>(`/crm/orders/${orderId}`, { headers: authHeaders(token) });
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  payload: OrderStatusUpdatePayload,
): Promise<Order> {
  return request<Order>(`/crm/orders/${orderId}/status`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
