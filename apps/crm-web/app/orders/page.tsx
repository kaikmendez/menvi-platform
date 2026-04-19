import { Card, TableWrapper } from '@menvi/ui';

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <Card>
        <TableWrapper>
          <table className="min-w-full text-sm">
            <thead><tr><th className="p-2 text-left">Pedido</th><th className="p-2 text-left">Status</th></tr></thead>
            <tbody><tr><td className="p-2">#1001</td><td className="p-2">PENDING</td></tr></tbody>
          </table>
        </TableWrapper>
      </Card>
    </main>
  );
}
