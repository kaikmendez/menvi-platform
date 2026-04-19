import { Button, Card } from '@menvi/ui';
import { formatCurrencyBRL } from '@menvi/utils';

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="space-y-3">
        <h1 className="text-2xl font-bold">Produto #{params.id}</h1>
        <p>Detalhes iniciais do produto.</p>
        <p className="text-sm text-zinc-500">Preço base: {formatCurrencyBRL(49.9)}</p>
        <Button>Adicionar ao carrinho</Button>
      </Card>
    </main>
  );
}
