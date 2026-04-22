import { getVapidPublicKey, subscribeOrderPush } from './api';

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) {
    view[i] = raw.charCodeAt(i);
  }
  return buffer;
}

export type EnablePushResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | 'no-vapid' | 'error'; message?: string };

export async function enablePushForOrder(orderId: string): Promise<EnablePushResult> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'unsupported' };
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    const { public_key: vapidKey } = await getVapidPublicKey();
    if (!vapidKey) {
      return { ok: false, reason: 'no-vapid' };
    }

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
      });
    }

    const json = subscription.toJSON();
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!json.endpoint || !p256dh || !auth) {
      return { ok: false, reason: 'error', message: 'Assinatura inválida.' };
    }

    await subscribeOrderPush(orderId, {
      endpoint: json.endpoint,
      keys: { p256dh, auth },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}
