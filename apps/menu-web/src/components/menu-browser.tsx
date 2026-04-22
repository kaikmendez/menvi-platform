'use client';

import * as React from 'react';
import Link from 'next/link';
import type { PublicMenu, Product } from '@menvi/types';
import { Badge, Button, Card, CardContent } from '@menvi/ui';
import { formatBRL } from '@menvi/utils';
import { ShoppingCart } from 'lucide-react';
import { ProductDialog } from './product-dialog';
import { CartDrawer } from './cart-drawer';
import { useCartStore, cartSubtotal } from '@/lib/cart-store';

interface Props {
  menu: PublicMenu;
}

export function MenuBrowser({ menu }: Props) {
  const [selected, setSelected] = React.useState<Product | null>(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const items = useCartStore((s) => s.items);
  const storeSlug = useCartStore((s) => s.slug);

  const cartItems = storeSlug === menu.slug ? items : [];
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = cartSubtotal(cartItems);

  return (
    <>
      <main className="min-h-screen bg-muted/30 pb-32">
        <header className="sticky top-0 z-30 border-b-2 border-primary bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="container flex max-w-3xl items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold sm:text-xl">{menu.name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  variant={menu.is_open ? 'default' : 'destructive'}
                  className="px-2 py-0 text-[11px]"
                >
                  {menu.is_open ? 'Aberto agora' : 'Fechado'}
                </Badge>
                <span className="text-muted-foreground">
                  Mín. {formatBRL(menu.min_order_amount)} · Entrega {formatBRL(menu.delivery_fee)}
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Abrir carrinho"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </header>

        {menu.description ? (
          <div className="border-b bg-muted/40">
            <div className="container max-w-3xl py-3 text-sm text-muted-foreground">
              {menu.description}
            </div>
          </div>
        ) : null}

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

      <CartDrawer
        slug={menu.slug}
        isOpen={menu.is_open}
        open={cartOpen}
        onOpenChange={setCartOpen}
      />

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
