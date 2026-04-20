import type { OrderStatus } from '@menvi/types';

/** Formata o código sequencial do pedido como #1042. */
export function formatOrderCode(code: number): string {
  return `#${code}`;
}

/** Label em pt-BR para um status de pedido. */
export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pendente';
    case 'CONFIRMED':
      return 'Confirmado';
    case 'PREPARING':
      return 'Em preparo';
    case 'READY':
      return 'Pronto';
    case 'DELIVERED':
      return 'Entregue';
    case 'CANCELLED':
      return 'Cancelado';
  }
}

/** Cor semântica (Tailwind tokens) por status. */
export function orderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-900';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-900';
    case 'PREPARING':
      return 'bg-orange-100 text-orange-900';
    case 'READY':
      return 'bg-emerald-100 text-emerald-900';
    case 'DELIVERED':
      return 'bg-zinc-100 text-zinc-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-900';
  }
}
