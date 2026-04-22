import type { PublicMenu, Order, OrderCreatePayload, PublicOrder } from '@menvi/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function getPublicMenu(slug: string): Promise<PublicMenu> {
  return apiGet<PublicMenu>(`/public/menu/${slug}`, { cache: 'no-store' });
}

export async function createOrder(slug: string, payload: OrderCreatePayload): Promise<Order> {
  return apiPost<Order>(`/public/restaurants/${slug}/orders`, payload);
}

export async function getPublicOrder(orderId: string): Promise<PublicOrder> {
  return apiGet<PublicOrder>(`/public/orders/${orderId}`, { cache: 'no-store' });
}

export async function getVapidPublicKey(): Promise<{ public_key: string | null }> {
  return apiGet<{ public_key: string | null }>(`/public/push/vapid-public-key`, {
    cache: 'no-store',
  });
}

export interface PushSubscribePayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeOrderPush(
  orderId: string,
  payload: PushSubscribePayload,
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(`/public/orders/${orderId}/push/subscribe`, payload);
}
