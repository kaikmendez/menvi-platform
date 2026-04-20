'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { OrderStatus } from '@menvi/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@menvi/ui';
import { formatBRL, orderStatusLabel, orderStatusColor } from '@menvi/utils';
import { getPublicOrder } from '@/lib/api';

interface Props {
  slug: string;
  orderId: string;
}

const TIMELINE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

function isTerminal(status: OrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED';
}

export function OrderTracker({ slug, orderId }: Props) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-order', orderId],
    queryFn: () => getPublicOrder(orderId),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s && isTerminal(s) ? false : 5000;
    },
  });

  if (isLoading) {
    return (
      <main className="container max-w-3xl py-10">
        <p className="text-muted-foreground">Carregando pedido…</p>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="container max-w-3xl py-10">
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Pedido não encontrado.'}
            </p>
            <Button asChild>
              <Link href={`/r/${slug}`}>Voltar ao cardápio</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentIdx = TIMELINE.indexOf(data.status);

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="container max-w-3xl space-y-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Pedido</p>
                <CardTitle className="text-2xl">#{data.code}</CardTitle>
              </div>
              <Badge className={orderStatusColor(data.status)}>
                {orderStatusLabel(data.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatBRL(data.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Feito em</span>
              <span>
                {new Date(data.created_at).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            {data.status === 'CANCELLED' ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Este pedido foi cancelado.
              </p>
            ) : (
              <ol className="space-y-2">
                {TIMELINE.map((s, i) => {
                  const reached = i <= currentIdx;
                  return (
                    <li
                      key={s}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                        reached ? 'bg-primary/10 border-primary/40' : 'opacity-60'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          reached
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm">{orderStatusLabel(s)}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            {!isTerminal(data.status) ? (
              <p className="text-xs text-muted-foreground">
                Esta página atualiza automaticamente a cada 5 segundos.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/r/${slug}`}>Voltar ao cardápio</Link>
        </Button>
      </div>
    </main>
  );
}
