'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@menvi/ui';
import { formatBRL, formatOrderCode, orderStatusColor, orderStatusLabel } from '@menvi/utils';
import { ArrowRight } from 'lucide-react';
import { listOrders } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isLast7Days(iso: string): boolean {
  const d = new Date(iso).getTime();
  return Date.now() - d <= 7 * 24 * 60 * 60 * 1000;
}

export default function PainelPage() {
  const token = useAuthStore((s) => s.accessToken);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'all', token],
    queryFn: () => listOrders(token!, { limit: 500 }),
    enabled: Boolean(token),
  });

  const kpis = useMemo(() => {
    const list = orders ?? [];
    const active = list.filter(
      (o) => !['DELIVERED', 'CANCELLED'].includes(o.status),
    );
    const today = list.filter((o) => isToday(o.created_at));
    const week = list.filter((o) => isLast7Days(o.created_at));
    const weekRevenue = week.reduce((s, o) => s + Number.parseFloat(o.total), 0);
    const todayRevenue = today.reduce((s, o) => s + Number.parseFloat(o.total), 0);
    const ticket = today.length > 0 ? todayRevenue / today.length : 0;
    const pending = list.filter((o) => o.status === 'PENDING');
    return {
      activeCount: active.length,
      todayCount: today.length,
      weekRevenue,
      ticket,
      pendingCount: pending.length,
    };
  }, [orders]);

  const recent = (orders ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do movimento de hoje e últimos 7 dias.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Pedidos ativos"
          value={kpis.activeCount.toString()}
          hint={`${kpis.pendingCount} aguardando confirmação`}
        />
        <KpiCard title="Pedidos hoje" value={kpis.todayCount.toString()} />
        <KpiCard title="Ticket médio hoje" value={formatBRL(kpis.ticket.toFixed(2))} />
        <KpiCard
          title="Faturamento 7 dias"
          value={formatBRL(kpis.weekRevenue.toFixed(2))}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pedidos recentes</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos pedidos do seu restaurante.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/fila">
              Ir para a fila
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatOrderCode(o.code)} · {o.customer.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.items.length} itens · {formatBRL(o.total)}
                    </p>
                  </div>
                  <Badge className={orderStatusColor(o.status)}>
                    {orderStatusLabel(o.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
