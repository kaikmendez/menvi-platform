import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@menvi/ui';

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center py-12">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Menvi</h1>
        <p className="text-lg text-muted-foreground">
          Cardápio digital dos restaurantes parceiros Menvi. Para abrir um cardápio, use o link
          enviado pelo restaurante no WhatsApp.
        </p>
        <Card className="text-left">
          <CardHeader>
            <CardTitle>Demonstração</CardTitle>
            <CardDescription>
              Abra o cardápio do restaurante demo para ver a plataforma em ação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/r/restaurante-demo">Abrir cardápio demo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
