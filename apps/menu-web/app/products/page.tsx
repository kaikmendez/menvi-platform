import Link from 'next/link';
import { Card } from '@menvi/ui';
import { formatCurrencyBRL } from '@menvi/utils';

const products = [
  { id: 'p1', name: 'Pizza Margherita', price: 49.9 },
  { id: 'p2', name: 'Pizza Calabresa', price: 52.9 }
];

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Produtos</h1>
      <div className="space-y-3">
        {products.map((product) => (
          <Card key={product.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-zinc-500">{formatCurrencyBRL(product.price)}</p>
            </div>
            <Link href={`/product/${product.id}`} className="text-sm text-zinc-600 underline">
              Ver detalhes
            </Link>
          </Card>
        ))}
      </div>
    </main>
  );
}
