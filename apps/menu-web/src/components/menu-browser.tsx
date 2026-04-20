'use client';

import * as React from 'react';
import Link from 'next/link';
import type { PublicMenu, Product } from '@menvi/types';
import { Badge, Button, Card, CardContent } from '@menvi/ui';
import { formatBRL } from '@menvi/utils';
import { ShoppingCart } from 'lucide-react';
import { ProductDialog } from './product-dialog';
import { useCartStore, cartSubtotal } from '@/lib/cart-store';

interface Props {
  menu: PublicMenu;
}

export function MenuBrowser({ menu }: Props) {
  const [selected, setSelected] = React.useState<Product | null>(null);
  const items = useCartStore((s) => s.items);
  const storeSlug = useCartStore((s) => s.slug);

  // Só conta itens se forem do mesmo restaurante que estou vendo.
  const cartItems = storeSlug === menu.slug ? items : [];
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = cartSubtotal(cartItems);

  return (
    <>
      <main className="min-h-screen bg-muted/30 pb-32">
        <header className="bg-primary text-primary-foreground">
          <div className="container max-w-3xl py-6">
            <h1 className="text-2xl font-bold sm:text-3xl">{menu.name}</h1>
            {menu.description ? (
              <p className="mt-1 text-sm text-primary-foreground/90 sm:text-base">
                {menu.description}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={menu.is_open ? 'default' : 'destructive'}>
                {menu.is_open ? 'Aberto agora' : 'Fechado'}
              </Badge>
              <span className="text-primary-foreground/80">
                Pedido mínimo {formatBRL(menu.min_order_amount)} · Entrega{' '}
                {formatBRL(menu.delivery_fee)}
              </span>
            </div>
          </div>
        </header>

        <div className="container max-w-3xl space-y-8 py-6">
          {menu.categories.length === 0 ? (
            <p className="text-muted-foreground">
              Este restaurante ainda não publicou o cardápio.
            </p>
          ) : null}

          {menu.categories.map((cat) => (
            <section key={cat.id} className="space-y-3">
              <h2 className="text-lg font-semibold">{cat.name}</h2>
              <div className="grid gap-3">
                {cat.products.map((p) => (
                  <Card
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-accent/40"
                    onClick={() => setSelected(p)}
                  >
                    <CardContent className="flex gap-3 p-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{p.name}</h3>
                        {p.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {p.description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-base font-semibold text-primary">
                          {formatBRL(p.price)}
                        </p>
                      </div>
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-24 w-24 rounded-md object-cover"
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {selected ? (
        <ProductDialog
          slug={menu.slug}
          product={selected}
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}

      {cartCount > 0 && menu.is_open ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="container max-w-3xl">
            <Button asChild size="lg" className="w-full justify-between">
              <Link href={`/r/${menu.slug}/carrinho`}>
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Ver carrinho · {cartCount} item{cartCount > 1 ? 's' : ''}
                </span>
                <span className="font-semibold">{formatBRL(subtotal.toFixed(2))}</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
