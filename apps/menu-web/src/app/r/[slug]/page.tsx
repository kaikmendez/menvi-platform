import { notFound } from 'next/navigation';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@menvi/ui';
import { formatBRL } from '@menvi/utils';
import { getPublicMenu } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MenuPage({ params }: PageProps) {
  const { slug } = await params;
  let data;
  try {
    data = await getPublicMenu(slug);
  } catch {
    notFound();
  }

  const { restaurant, categories } = data;

  return (
    <main className="min-h-screen bg-muted/30 pb-24">
      <header className="bg-primary text-primary-foreground">
        <div className="container py-8">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          {restaurant.description ? (
            <p className="mt-2 text-primary-foreground/90">{restaurant.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={restaurant.is_open ? 'default' : 'destructive'}>
              {restaurant.is_open ? 'Aberto agora' : 'Fechado'}
            </Badge>
            <span className="text-primary-foreground/80">
              Pedido mínimo {formatBRL(restaurant.settings.min_order_amount)} ·
              {' '}
              Entrega {formatBRL(restaurant.settings.delivery_fee)}
            </span>
          </div>
        </div>
      </header>

      <div className="container space-y-10 py-8">
        {categories.length === 0 ? (
          <p className="text-muted-foreground">Este restaurante ainda não publicou o cardápio.</p>
        ) : null}

        {categories.map((cat) => (
          <section key={cat.id} className="space-y-4">
            <h2 className="text-xl font-semibold">{cat.name}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.products.map((p) => (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {p.description ? (
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    ) : null}
                    <p className="text-lg font-semibold">{formatBRL(p.price)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
