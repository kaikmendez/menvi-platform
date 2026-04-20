'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@menvi/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@menvi/ui';
import { cn, formatBRL, formatOrderCode, orderStatusColor, orderStatusLabel } from '@menvi/utils';
import { Clock, MapPin, Phone, X } from 'lucide-react';
import { listOrders, updateOrderStatus } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

type ColumnKey = 'NEW' | 'PREPARING' | 'READY' | 'DELIVERED';

const COLUMNS: { key: ColumnKey; label: string; statuses: OrderStatus[] }[] = [
  { key: 'NEW', label: 'Novos', statuses: ['PENDING', 'CONFIRMED'] },
  { key: 'PREPARING', label: 'Preparando', statuses: ['PREPARING'] },
  { key: 'READY', label: 'Prontos', statuses: ['READY'] },
  { key: 'DELIVERED', label: 'Entregues hoje', statuses: ['DELIVERED'] },
];

function humanAge(iso: string): string {
  const delta = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (delta < 60) return `${Math.floor(delta)}s`;
  if (delta < 3_600) return `${Math.floor(delta / 60)}min`;
  return `${Math.floor(delta / 3_600)}h`;
}

function isTodayIso(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function FilaPage() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'kanban', token],
    queryFn: () => listOrders(token!, { limit: 200 }),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(token!, id, { status }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (selected && selected.id === updated.id) {
        setSelected(updated);
      }
    },
  });

  const grouped = React.useMemo(() => {
    const base: Record<ColumnKey, Order[]> = {
      NEW: [],
      PREPARING: [],
      READY: [],
      DELIVERED: [],
    };
    for (const o of orders ?? []) {
      if (o.status === 'CANCELLED') continue;
      if (o.status === 'DELIVERED' && !isTodayIso(o.created_at)) continue;
      const col = COLUMNS.find((c) => c.statuses.includes(o.status));
      if (col) base[col.key].push(o);
    }
    return base;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fila de pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Novos pedidos entram automaticamente. Clique em um card para ver detalhes e avançar.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = grouped[col.key];
            return (
              <div key={col.key} className="flex min-h-[200px] flex-col rounded-lg bg-muted/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {items.length === 0 ? (
                    <p className="pt-6 text-center text-xs text-muted-foreground">—</p>
                  ) : (
                    items.map((o) => (
                      <KanbanCard
                        key={o.id}
                        order={o}
                        onClick={() => setSelected(o)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderDetailDialog
        order={selected}
        onClose={() => setSelected(null)}
        onAdvance={(status) => selected && mutation.mutate({ id: selected.id, status })}
        onCancel={() => selected && mutation.mutate({ id: selected.id, status: 'CANCELLED' })}
        mutating={mutation.isPending}
      />
    </div>
  );
}

function KanbanCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const isUrgent = order.status === 'PENDING';
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'cursor-pointer transition hover:shadow-md',
        isUrgent && 'border-primary/40 shadow-sm',
      )}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{formatOrderCode(order.code)}</span>
          <Badge className={orderStatusColor(order.status)} variant="outline">
            {orderStatusLabel(order.status)}
          </Badge>
        </div>
        <p className="truncate text-sm">{order.customer.name}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {order.items.length} item{order.items.length === 1 ? '' : 's'}
          </span>
          <span>{formatBRL(order.total)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          há {humanAge(order.created_at)}
        </div>
      </CardContent>
    </Card>
  );
}

function nextStatus(s: OrderStatus): OrderStatus | null {
  switch (s) {
    case 'PENDING':
      return 'CONFIRMED';
    case 'CONFIRMED':
      return 'PREPARING';
    case 'PREPARING':
      return 'READY';
    case 'READY':
      return 'DELIVERED';
    default:
      return null;
  }
}

function nextStatusLabel(s: OrderStatus): string | null {
  const map: Partial<Record<OrderStatus, string>> = {
    PENDING: 'Confirmar',
    CONFIRMED: 'Iniciar preparo',
    PREPARING: 'Marcar pronto',
    READY: 'Marcar entregue',
  };
  return map[s] ?? null;
}

interface DetailProps {
  order: Order | null;
  onClose: () => void;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
  mutating: boolean;
}

function OrderDetailDialog({ order, onClose, onAdvance, onCancel, mutating }: DetailProps) {
  const open = Boolean(order);
  const next = order ? nextStatus(order.status) : null;
  const nextLabel = order ? nextStatusLabel(order.status) : null;
  const canCancel =
    order && !['DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {order ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle>{formatOrderCode(order.code)}</DialogTitle>
                <Badge className={orderStatusColor(order.status)}>
                  {orderStatusLabel(order.status)}
                </Badge>
              </div>
              <DialogDescription>
                Aberto há {humanAge(order.created_at)} · {new Date(order.created_at).toLocaleString('pt-BR')}
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-1 rounded-md border p-3 text-sm">
              <p className="font-medium">{order.customer.name}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {order.customer.phone}
              </p>
              {order.notes ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5" />
                  {order.notes}
                </p>
              ) : null}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Itens</h3>
              <ul className="divide-y text-sm">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {i.quantity}× {i.product_name}
                      </p>
                      {i.options.length > 0 ? (
                        <ul className="text-xs text-muted-foreground">
                          {i.options.map((o) => (
                            <li key={o.id}>+ {o.name}</li>
                          ))}
                        </ul>
                      ) : null}
                      {i.notes ? (
                        <p className="text-xs italic text-muted-foreground">Obs.: {i.notes}</p>
                      ) : null}
                    </div>
                    <span className="whitespace-nowrap">{formatBRL(i.total)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-1 rounded-md border p-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatBRL(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Entrega</span>
                <span>{formatBRL(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatBRL(order.total)}</span>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Pagamento: {order.payment_method}
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Histórico</h3>
              <ol className="space-y-1 text-xs text-muted-foreground">
                {order.events.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3">
                    <span>
                      {orderStatusLabel(e.to_status)}
                      {e.note ? ` — ${e.note}` : ''}
                    </span>
                    <span>{new Date(e.created_at).toLocaleString('pt-BR')}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex flex-wrap justify-end gap-2">
              {canCancel ? (
                <Button variant="outline" onClick={onCancel} disabled={mutating}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar pedido
                </Button>
              ) : null}
              {next && nextLabel ? (
                <Button onClick={() => onAdvance(next)} disabled={mutating}>
                  {nextLabel}
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
