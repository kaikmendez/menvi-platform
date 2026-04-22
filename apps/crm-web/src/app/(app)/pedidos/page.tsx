'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@menvi/types';
import {
  Badge,
  Card,
  CardContent,
  Input,
} from '@menvi/ui';
import { formatBRL, formatOrderCode, orderStatusColor, orderStatusLabel } from '@menvi/utils';
import { listOrders } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

const FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'PREPARING', label: 'Preparando' },
  { value: 'READY', label: 'Prontos' },
  { value: 'DELIVERED', label: 'Entregues' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

export default function PedidosPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [filter, setFilter] = React.useState<OrderStatus | 'ALL'>('ALL');
  const [q, setQ] = React.useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'history', filter, token],
    queryFn: () =>
      listOrders(token!, {
        limit: 500,
        status: filter === 'ALL' ? undefined : filter,
      }),
    enabled: Boolean(token),
  });

  const filtered = React.useMemo(() => {
    const list = orders ?? [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (o: Order) =>
        o.customer.name.toLowerCase().includes(needle) ||
        o.customer.phone.includes(needle) ||
        (o.customer.address ?? '').toLowerCase().includes(needle) ||
        String(o.code).includes(needle),
    );
  }, [orders, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico de pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Consulte todos os pedidos por status ou pesquise por cliente, telefone ou número.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              filter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Input
        placeholder="Buscar por cliente, telefone, endereço ou #código…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {filtered.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatOrderCode(o.code)} · {o.customer.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.customer.phone} · {o.items.length} itens · {formatBRL(o.total)}
                    </p>
                    {o.customer.address ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {o.customer.address}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    <Badge className={orderStatusColor(o.status)} variant="outline">
                      {orderStatusLabel(o.status)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
