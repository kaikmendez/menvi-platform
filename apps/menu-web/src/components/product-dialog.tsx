'use client';

import * as React from 'react';
import type { Product, ProductOption } from '@menvi/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Separator,
  Textarea,
} from '@menvi/ui';
import { formatBRL, cn } from '@menvi/utils';
import { Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

interface ProductDialogProps {
  slug: string;
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDialog({ slug, product, open, onOpenChange }: ProductDialogProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState('');
  const [selectedOptionIds, setSelectedOptionIds] = React.useState<Set<string>>(new Set());

  // Reset state toda vez que o dialog abrir com um produto novo.
  React.useEffect(() => {
    if (open) {
      setQuantity(1);
      setNotes('');
      setSelectedOptionIds(new Set());
    }
  }, [open, product.id]);

  const toggleOption = (id: string) => {
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedOptions = product.options.filter((o) => selectedOptionIds.has(o.id));
  const basePrice = Number.parseFloat(product.price);
  const optionsPrice = selectedOptions.reduce(
    (acc, o) => acc + Number.parseFloat(o.price_delta),
    0,
  );
  const unitPrice = basePrice + optionsPrice;
  const total = unitPrice * quantity;

  const handleAdd = () => {
    addItem(slug, {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      image_url: product.image_url,
      quantity,
      notes: notes.trim() ? notes.trim() : null,
      options: selectedOptions.map((o) => ({
        id: o.id,
        name: o.name,
        price_delta: o.price_delta,
      })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          {product.description ? (
            <DialogDescription>{product.description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-4">
          {product.options.length > 0 ? (
            <div className="space-y-2">
              <Label>Adicionais</Label>
              <div className="flex flex-col gap-2">
                {product.options.map((opt: ProductOption) => {
                  const checked = selectedOptionIds.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(opt.id)}
                      className={cn(
                        'flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
                        checked
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:bg-accent',
                      )}
                    >
                      <span className="text-sm">{opt.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {Number.parseFloat(opt.price_delta) > 0
                          ? `+ ${formatBRL(opt.price_delta)}`
                          : formatBRL(opt.price_delta)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="product-notes">Observações</Label>
            <Textarea
              id="product-notes"
              placeholder="Sem cebola, bem passado…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[2ch] text-center font-medium">{quantity}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{formatBRL(total.toFixed(2))}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" className="w-full" size="lg" onClick={handleAdd}>
            Adicionar ao carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
