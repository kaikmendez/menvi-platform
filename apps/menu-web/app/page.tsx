import Link from 'next/link';
import { Card, Button } from '@menvi/ui';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="space-y-4">
        <h1 className="text-2xl font-bold">Menvi Menu Digital</h1>
        <p>Bem-vindo ao cardápio digital do restaurante.</p>
        <div className="flex gap-2">
          <Link href="/categories"><Button>Ver categorias</Button></Link>
          <Link href="/cart"><Button className="bg-emerald-600 hover:bg-emerald-500">Abrir carrinho</Button></Link>
        </div>
      </Card>
    </main>
  );
}
