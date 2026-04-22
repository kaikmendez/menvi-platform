'use client';

import * as React from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { Button } from '@menvi/ui';
import { enablePushForOrder } from '@/lib/push';

interface Props {
  orderId: string;
  trackingUrl: string;
  restaurantName: string;
}

type PushState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok' }
  | { kind: 'unsupported' }
  | { kind: 'denied' }
  | { kind: 'no-vapid' }
  | { kind: 'error'; message: string };

const PUSH_COPY: Record<Exclude<PushState['kind'], 'idle' | 'loading' | 'error'>, string> = {
  ok: 'Prontinho! Você receberá uma notificação quando o status mudar.',
  unsupported: 'Seu navegador não suporta notificações push.',
  denied: 'Permissão negada. Autorize nas configurações do navegador.',
  'no-vapid': 'Notificações push ainda não estão configuradas neste ambiente.',
};

export function NotifyActions({ orderId, trackingUrl, restaurantName }: Props) {
  const [push, setPush] = React.useState<PushState>({ kind: 'idle' });

  const waText = encodeURIComponent(
    `Acompanhe meu pedido na ${restaurantName}: ${trackingUrl}`,
  );
  const waHref = `https://wa.me/?text=${waText}`;

  async function onSubscribe() {
    setPush({ kind: 'loading' });
    const res = await enablePushForOrder(orderId);
    if (res.ok) {
      setPush({ kind: 'ok' });
    } else if (res.reason === 'error') {
      setPush({ kind: 'error', message: res.message ?? 'Erro desconhecido.' });
    } else {
      setPush({ kind: res.reason });
    }
  }

  const message =
    push.kind === 'error'
      ? push.message
      : push.kind !== 'idle' && push.kind !== 'loading'
      ? PUSH_COPY[push.kind]
      : null;

  return (
    <div className="space-y-2 rounded-md border bg-background p-3">
      <p className="text-sm font-medium">Acompanhe o pedido</p>
      <p className="text-xs text-muted-foreground">
        Salve o link no WhatsApp e/ou receba um aviso no celular quando o status mudar.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" className="flex-1">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar link no WhatsApp
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onSubscribe}
          disabled={push.kind === 'loading' || push.kind === 'ok'}
        >
          <Bell className="mr-2 h-4 w-4" />
          {push.kind === 'loading'
            ? 'Configurando…'
            : push.kind === 'ok'
            ? 'Notificações ativas'
            : 'Receber notificações'}
        </Button>
      </div>

      {message ? (
        <p
          className={
            push.kind === 'ok'
              ? 'text-xs text-emerald-700'
              : 'text-xs text-muted-foreground'
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
