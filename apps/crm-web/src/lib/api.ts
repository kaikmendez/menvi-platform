import type {
  Category,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  CurrentUserOut,
  Order,
  OrderStatus,
  OrderStatusUpdatePayload,
  Product,
  ProductCreatePayload,
  ProductOption,
  ProductOptionCreatePayload,
  ProductOptionUpdatePayload,
  ProductUpdatePayload,
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

// ---------- Categorias ----------
export async function listCategories(token: string): Promise<Category[]> {
  return request<Category[]>('/crm/categories', { headers: authHeaders(token) });
}

export async function createCategory(
  token: string,
  payload: CategoryCreatePayload,
): Promise<Category> {
  return request<Category>('/crm/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  token: string,
  id: string,
  payload: CategoryUpdatePayload,
): Promise<Category> {
  return request<Category>(`/crm/categories/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/crm/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
}

// ---------- Produtos ----------
export async function listProducts(token: string): Promise<Product[]> {
  return request<Product[]>('/crm/products', { headers: authHeaders(token) });
}

export async function getProduct(token: string, id: string): Promise<Product> {
  return request<Product>(`/crm/products/${id}`, { headers: authHeaders(token) });
}

export async function createProduct(
  token: string,
  payload: ProductCreatePayload,
): Promise<Product> {
  return request<Product>('/crm/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  token: string,
  id: string,
  payload: ProductUpdatePayload,
): Promise<Product> {
  return request<Product>(`/crm/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/crm/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
}

// ---------- Adicionais ----------
export async function addProductOption(
  token: string,
  productId: string,
  payload: ProductOptionCreatePayload,
): Promise<ProductOption> {
  return request<ProductOption>(`/crm/products/${productId}/options`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function updateProductOption(
  token: string,
  productId: string,
  optionId: string,
  payload: ProductOptionUpdatePayload,
): Promise<ProductOption> {
  return request<ProductOption>(`/crm/products/${productId}/options/${optionId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteProductOption(
  token: string,
  productId: string,
  optionId: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/crm/products/${productId}/options/${optionId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
}
