import { Card, Badge } from '@menvi/ui';

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Card><p>Pedidos hoje</p><Badge>12</Badge></Card>
        <Card><p>Clientes ativos</p><Badge>38</Badge></Card>
        <Card><p>Ticket médio</p><Badge>R$ 58,20</Badge></Card>
      </div>
    </main>
  );
}
