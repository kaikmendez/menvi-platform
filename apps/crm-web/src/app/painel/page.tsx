'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@menvi/ui';
import { formatBRL, formatOrderCode, orderStatusColor, orderStatusLabel } from '@menvi/utils';
import { listOrders } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function PainelPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', token],
    queryFn: () => listOrders(token!),
    enabled: Boolean(token),
  });

  if (!token) return null;

  return (
    <main className="container min-h-screen py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel</h1>
          <p className="text-muted-foreground">
            Bem-vindo{user ? `, ${user.name}` : ''}. Scaffold inicial — Fase 4 traz Kanban,
            dashboard completo e realtime.
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pedidos recentes</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !orders || orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">{formatOrderCode(o.code)}</CardTitle>
                  <Badge className={orderStatusColor(o.status)} variant="outline">
                    {orderStatusLabel(o.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-muted-foreground">{o.items.length} itens</p>
                  <p className="text-base font-semibold">{formatBRL(o.total)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
