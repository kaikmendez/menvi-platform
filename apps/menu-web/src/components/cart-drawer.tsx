'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@menvi/ui';
import { formatBRL } from '@menvi/utils';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import {
  cartSubtotal,
  lineTotal,
  lineUnitPrice,
  useCartStore,
  type CartItem,
} from '@/lib/cart-store';

interface Props {
  slug: string;
  isOpen: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ slug, isOpen, open, onOpenChange }: Props) {
  const items = useCartStore((s) => s.items);
  const storeSlug = useCartStore((s) => s.slug);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const cartItems: CartItem[] = storeSlug === slug ? items : [];
  const subtotal = cartSubtotal(cartItems);
  const count = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <div>
              <SheetTitle>Seu carrinho</SheetTitle>
              <SheetDescription>
                {count === 0
                  ? 'Nenhum item ainda — adicione algo do cardápio.'
                  : `${count} item${count > 1 ? 's' : ''} no carrinho`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <EmptyCart onClose={() => onOpenChange(false)} />
          ) : (
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li key={item.line_id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(lineUnitPrice(item).toFixed(2))} / un
                      </p>
                      {item.options.length > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          + {item.options.map((o) => o.name).join(', ')}
                        </p>
                      ) : null}
                      {item.notes ? (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          &ldquo;{item.notes}&rdquo;
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold">
                      {formatBRL(lineTotal(item).toFixed(2))}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border">
                      <button
                        type="button"
                        aria-label="Diminuir quantidade"
                        className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        onClick={() => updateQuantity(item.line_id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2ch] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumentar quantidade"
                        className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        onClick={() => updateQuantity(item.line_id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label="Remover item"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.line_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Separator />
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="border-t bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatBRL(subtotal.toFixed(2))}</span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Taxa de entrega calculada na próxima etapa.
            </p>
            {isOpen ? (
              <Button asChild size="lg" className="w-full">
                <Link href={`/r/${slug}/carrinho`} onClick={() => onOpenChange(false)}>
                  Ir para o carrinho
                </Link>
              </Button>
            ) : (
              <Badge variant="destructive" className="w-full justify-center py-2">
                Restaurante fechado — não é possível finalizar
              </Badge>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShoppingCart className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">
        Seu carrinho está vazio.<br />Adicione produtos pra ver aqui.
      </p>
      <Button variant="outline" size="sm" onClick={onClose}>
        Ver cardápio
      </Button>
    </div>
  );
}
