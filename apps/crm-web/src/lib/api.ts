import type { CurrentUserOut, Order, TokenPair } from '@menvi/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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

export async function login(email: string, password: string): Promise<TokenPair> {
  return request<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token: string): Promise<CurrentUserOut> {
  return request<CurrentUserOut>('/crm/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listOrders(token: string): Promise<Order[]> {
  return request<Order[]>('/crm/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
