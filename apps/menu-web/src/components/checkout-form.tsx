'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PaymentMethod, PublicMenu, OrderCreatePayload } from '@menvi/types';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Textarea,
} from '@menvi/ui';
import { formatBRL } from '@menvi/utils';
import { ArrowLeft } from 'lucide-react';
import { createOrder } from '@/lib/api';
import { useCartStore, cartSubtotal } from '@/lib/cart-store';

interface Props {
  menu: PublicMenu;
}

type AcceptedPayment = {
  value: PaymentMethod;
  label: string;
};

export function CheckoutForm({ menu }: Props) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const storeSlug = useCartStore((s) => s.slug);
  const clear = useCartStore((s) => s.clear);

  const cartItems = storeSlug === menu.slug ? items : [];
  const subtotal = cartSubtotal(cartItems);
  const deliveryFee = Number.parseFloat(menu.delivery_fee);
  const total = subtotal + deliveryFee;

  const acceptedMethods: AcceptedPayment[] = [
    menu.accepts_pix ? { value: 'PIX' as const, label: 'Pix' } : null,
    menu.accepts_card ? { value: 'CARD' as const, label: 'Cartão na entrega' } : null,
    menu.accepts_cash ? { value: 'CASH' as const, label: 'Dinheiro' } : null,
  ].filter((m): m is AcceptedPayment => m !== null);

  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    acceptedMethods[0]?.value ?? 'PIX',
  );
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const disabled =
    submitting ||
    cartItems.length === 0 ||
    customerName.trim().length === 0 ||
    customerPhone.trim().length < 8 ||
    acceptedMethods.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setSubmitting(true);
    setError(null);

    const payload: OrderCreatePayload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || null,
      customer_address: customerAddress.trim() || null,
      payment_method: paymentMethod,
      notes: notes.trim() || null,
      items: cartItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        notes: i.notes,
        option_ids: i.options.map((o) => o.id),
      })),
    };

    try {
      const order = await createOrder(menu.slug, payload);
      clear();
      router.push(`/r/${menu.slug}/pedido/${order.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar pedido';
      setError(msg);
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="container max-w-3xl space-y-4 py-6">
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-muted-foreground">Seu carrinho está vazio.</p>
            <Button asChild>
              <Link href={`/r/${menu.slug}`}>Ver cardápio</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="container flex max-w-3xl items-center gap-3 py-3">
          <Button variant="ghost" size="icon" asChild aria-label="Voltar ao carrinho">
            <Link href={`/r/${menu.slug}/carrinho`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Finalizar pedido</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="container max-w-3xl space-y-4 py-6">
        <Card>
          <CardContent className="space-y-4 p-4">
            <h2 className="font-medium">Seus dados</h2>
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nome *</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                maxLength={160}
                autoComplete="name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Telefone (WhatsApp) *</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Endereço de entrega</Label>
              <Textarea
                id="customer-address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Rua, número, bairro, complemento"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="font-medium">Forma de pagamento</h2>
            {acceptedMethods.length === 0 ? (
              <p className="text-sm text-destructive">
                Nenhuma forma de pagamento configurada.
              </p>
            ) : (
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                {acceptedMethods.map((m) => (
                  <Label
                    key={m.value}
                    htmlFor={`pm-${m.value}`}
                    className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <RadioGroupItem id={`pm-${m.value}`} value={m.value} />
                    <span>{m.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <Label htmlFor="order-notes">Observações do pedido</Label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Algum detalhe para a cozinha?"
              maxLength={500}
            />
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={disabled}>
          {submitting ? 'Enviando…' : `Enviar pedido · ${formatBRL(total.toFixed(2))}`}
        </Button>
      </form>
    </main>
  );
}
