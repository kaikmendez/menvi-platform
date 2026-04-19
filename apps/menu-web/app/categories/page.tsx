import Link from 'next/link';
import { Card, Badge } from '@menvi/ui';

const categories = [
  { id: '1', name: 'Pizzas' },
  { id: '2', name: 'Bebidas' },
  { id: '3', name: 'Sobremesas' }
];

export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Categorias</h1>
      <div className="space-y-3">
        {categories.map((category) => (
          <Card key={category.id} className="flex items-center justify-between">
            <span>{category.name}</span>
            <Link href="/products" className="text-sm text-zinc-600 underline">
              <Badge>Ver produtos</Badge>
            </Link>
          </Card>
        ))}
      </div>
    </main>
  );
}
