'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicMenu } from '@menvi/types';
import {
  Button,
  Card,
  CardContent,
  Separator,
} from '@menvi/ui';
import { formatBRL } from '@menvi/utils';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import {
  useCartStore,
  cartSubtotal,
  lineUnitPrice,
  lineTotal,
} from '@/lib/cart-store';

interface Props {
  menu: PublicMenu;
}

export function CartView({ menu }: Props) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const storeSlug = useCartStore((s) => s.slug);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const cartItems = storeSlug === menu.slug ? items : [];
  const subtotal = cartSubtotal(cartItems);
  const deliveryFee = Number.parseFloat(menu.delivery_fee);
  const minOrder = Number.parseFloat(menu.min_order_amount);
  const total = subtotal + deliveryFee;
  const belowMin = subtotal > 0 && subtotal < minOrder;

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="container flex max-w-3xl items-center gap-3 py-3">
          <Button variant="ghost" size="icon" asChild aria-label="Voltar ao cardápio">
            <Link href={`/r/${menu.slug}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Carrinho</h1>
        </div>
      </header>

      <div className="container max-w-3xl space-y-4 py-6">
        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 py-10 text-center">
              <p className="text-muted-foreground">Seu carrinho está vazio.</p>
              <Button asChild>
                <Link href={`/r/${menu.slug}`}>Voltar ao cardápio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <Card key={item.line_id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium">{item.product_name}</h3>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.line_id)}
                          aria-label={`Remover ${item.product_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.options.length > 0 ? (
                        <ul className="text-xs text-muted-foreground">
                          {item.options.map((o) => (
                            <li key={o.id}>
                              + {o.name}{' '}
                              <span>({formatBRL(o.price_delta)})</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {item.notes ? (
                        <p className="text-xs italic text-muted-foreground">
                          Obs.: {item.notes}
                        </p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        Unitário {formatBRL(lineUnitPrice(item).toFixed(2))}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.line_id, item.quantity - 1)}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[2ch] text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.line_id, item.quantity + 1)}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-semibold">
                        {formatBRL(lineTotal(item).toFixed(2))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatBRL(subtotal.toFixed(2))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>{formatBRL(deliveryFee.toFixed(2))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatBRL(total.toFixed(2))}</span>
                </div>
                {belowMin ? (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    Pedido mínimo de {formatBRL(minOrder.toFixed(2))}. Falta{' '}
                    {formatBRL((minOrder - subtotal).toFixed(2))}.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full"
              disabled={belowMin || !menu.is_open}
              onClick={() => router.push(`/r/${menu.slug}/checkout`)}
            >
              {menu.is_open ? 'Ir para checkout' : 'Restaurante fechado'}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
