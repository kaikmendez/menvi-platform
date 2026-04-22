'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
  Textarea,
} from '@menvi/ui';
import { Loader2, Save } from 'lucide-react';
import {
  getRestaurant,
  getRestaurantSettings,
  updateRestaurant,
  updateRestaurantSettings,
} from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function decimalInputToString(v: string): string {
  const normalized = v.replace(',', '.').trim();
  if (!normalized) return '0';
  const n = Number(normalized);
  if (Number.isNaN(n) || n < 0) return '0';
  return n.toFixed(2);
}

export default function ConfiguracoesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const qc = useQueryClient();
  const [feedback, setFeedback] = React.useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const { data: restaurant, isLoading: loadingR } = useQuery({
    queryKey: ['restaurant', token],
    queryFn: () => getRestaurant(token!),
    enabled: Boolean(token),
  });
  const { data: settings, isLoading: loadingS } = useQuery({
    queryKey: ['restaurant-settings', token],
    queryFn: () => getRestaurantSettings(token!),
    enabled: Boolean(token),
  });

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [whatsappPhone, setWhatsappPhone] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [coverUrl, setCoverUrl] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(true);

  const [deliveryFee, setDeliveryFee] = React.useState('0');
  const [minOrder, setMinOrder] = React.useState('0');
  const [acceptsPix, setAcceptsPix] = React.useState(true);
  const [acceptsCard, setAcceptsCard] = React.useState(true);
  const [acceptsCash, setAcceptsCash] = React.useState(true);
  const [openingHours, setOpeningHours] = React.useState('');

  React.useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setDescription(restaurant.description ?? '');
      setWhatsappPhone(restaurant.whatsapp_phone ?? '');
      setLogoUrl(restaurant.logo_url ?? '');
      setCoverUrl(restaurant.cover_url ?? '');
      setIsOpen(restaurant.is_open);
    }
  }, [restaurant]);

  React.useEffect(() => {
    if (settings) {
      setDeliveryFee(String(settings.delivery_fee));
      setMinOrder(String(settings.min_order_amount));
      setAcceptsPix(settings.accepts_pix);
      setAcceptsCard(settings.accepts_card);
      setAcceptsCash(settings.accepts_cash);
      setOpeningHours(settings.opening_hours ?? '');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      await updateRestaurant(token!, {
        name,
        description: description || null,
        whatsapp_phone: whatsappPhone || null,
        logo_url: logoUrl || null,
        cover_url: coverUrl || null,
        is_open: isOpen,
      });
      await updateRestaurantSettings(token!, {
        delivery_fee: decimalInputToString(deliveryFee),
        min_order_amount: decimalInputToString(minOrder),
        accepts_pix: acceptsPix,
        accepts_card: acceptsCard,
        accepts_cash: acceptsCash,
        opening_hours: openingHours || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant'] });
      qc.invalidateQueries({ queryKey: ['restaurant-settings'] });
      setFeedback({ kind: 'ok', text: 'Configurações salvas.' });
    },
    onError: (err) => {
      setFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Erro ao salvar.',
      });
    },
  });

  if (role !== 'OWNER') {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Apenas o dono da conta pode editar as configurações do restaurante.
        </p>
      </div>
    );
  }

  const loading = loadingR || loadingS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Dados do restaurante, taxa de entrega, pedido mínimo e formas de pagamento.
          </p>
        </div>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || loading}
          size="lg"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar alterações
        </Button>
      </div>

      {feedback ? (
        <div
          className={
            feedback.kind === 'ok'
              ? 'rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
              : 'rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          }
          role="status"
        >
          {feedback.text}
        </div>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Restaurante</CardTitle>
            <CardDescription>Dados exibidos no link público e no WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Descrição curta</Label>
              <Textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Hamburgueria artesanal na zona sul."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp_phone">WhatsApp</Label>
              <Input
                id="whatsapp_phone"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+55 11 99999-9999"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo_url">URL do logo</Label>
              <Input
                id="logo_url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cover_url">URL da capa</Label>
              <Input
                id="cover_url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
              <div>
                <p className="text-sm font-medium">Aceitando pedidos agora</p>
                <p className="text-xs text-muted-foreground">
                  Desligue para pausar todo o cardápio público.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isOpen ? 'default' : 'destructive'}>
                  {isOpen ? 'Aberto' : 'Fechado'}
                </Badge>
                <Switch checked={isOpen} onCheckedChange={setIsOpen} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operação</CardTitle>
            <CardDescription>Valores cobrados e regras de pedido.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="delivery_fee">Taxa de entrega (R$)</Label>
              <Input
                id="delivery_fee"
                inputMode="decimal"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min_order">Pedido mínimo (R$)</Label>
              <Input
                id="min_order"
                inputMode="decimal"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="opening_hours">Horário de funcionamento</Label>
              <Textarea
                id="opening_hours"
                rows={3}
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Ex.: Seg a Sex: 18h-23h · Sáb e Dom: 12h-23h"
              />
              <p className="text-xs text-muted-foreground">
                Texto livre exibido no cardápio público.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
            <CardDescription>
              Selecione o que o cliente pode escolher no checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <PaymentRow
              label="PIX"
              description="Cobrança via chave PIX informada na entrega."
              checked={acceptsPix}
              onChange={setAcceptsPix}
            />
            <PaymentRow
              label="Cartão (maquininha)"
              description="Débito e crédito presencial ou na entrega."
              checked={acceptsCard}
              onChange={setAcceptsCard}
            />
            <PaymentRow
              label="Dinheiro"
              description="Troco sob responsabilidade do entregador."
              checked={acceptsCash}
              onChange={setAcceptsCash}
            />
            <Separator className="opacity-0" />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || loading} size="lg">
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  );
}

function PaymentRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
