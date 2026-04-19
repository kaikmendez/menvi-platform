import { Button, Card } from '@menvi/ui';

export default function CartPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Carrinho</h1>
      <Card className="space-y-4">
        <p>Seu carrinho está vazio.</p>
        <Button className="bg-emerald-600 hover:bg-emerald-500">Finalizar pedido</Button>
      </Card>
    </main>
  );
}
