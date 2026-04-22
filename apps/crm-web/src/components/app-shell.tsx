'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@menvi/types';
import { Badge, Button } from '@menvi/ui';
import { cn } from '@menvi/utils';
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Pause,
  Play,
  Settings,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useOrdersRealtime } from '@/lib/use-orders-realtime';
import { getRestaurant, listOrders, updateRestaurant } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/painel', label: 'Painel', icon: LayoutDashboard },
  { href: '/fila', label: 'Fila de pedidos', icon: ChefHat },
  { href: '/pedidos', label: 'Histórico', icon: ClipboardList },
  { href: '/cardapio', label: 'Cardápio', icon: UtensilsCrossed, roles: ['OWNER', 'MANAGER'] },
  { href: '/clientes', label: 'Clientes', icon: Users, disabled: true, roles: ['OWNER', 'MANAGER'] },
  {
    href: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    disabled: true,
    roles: ['OWNER', 'MANAGER'],
  },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['OWNER'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  // Guarda de autenticação.
  React.useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', token],
    queryFn: () => getRestaurant(token!),
    enabled: Boolean(token),
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['orders', 'PENDING', token],
    queryFn: () => listOrders(token!, { status: 'PENDING' }),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  const pauseMutation = useMutation({
    mutationFn: (is_open: boolean) => updateRestaurant(token!, { is_open }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant'] }),
  });

  // Conecta ao WebSocket e toca som em novos pedidos.
  useOrdersRealtime(token);

  if (!token) return null;

  const role = user?.role ?? 'ATTENDANT';

  const handleLogout = () => {
    clear();
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <Link href="/painel" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              M
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Menvi</p>
              <p className="text-xs text-sidebar-muted">CRM</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(role)).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                }}
                aria-disabled={item.disabled}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                  item.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-sidebar-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.disabled ? (
                  <span className="text-[10px] uppercase text-sidebar-muted">em breve</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? 'Usuário'}</p>
            <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
            <Badge
              variant="outline"
              className="mt-2 border-sidebar-border bg-sidebar-accent capitalize text-sidebar-foreground"
            >
              {role.toLowerCase()}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{restaurant?.name ?? '…'}</span>
            {restaurant ? (
              <Badge variant={restaurant.is_open ? 'default' : 'destructive'}>
                {restaurant.is_open ? 'Aberto' : 'Fechado'}
              </Badge>
            ) : null}
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {pendingOrders?.length ?? 0} pendente{(pendingOrders?.length ?? 0) === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {restaurant ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <a
                  href={`${process.env.NEXT_PUBLIC_MENU_URL ?? 'http://localhost:3000'}/r/${restaurant.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver cardápio
                </a>
              </Button>
            ) : null}
            {restaurant && (role === 'OWNER' || role === 'MANAGER') ? (
              <Button
                size="sm"
                variant={restaurant.is_open ? 'destructive' : 'default'}
                disabled={pauseMutation.isPending}
                onClick={() => pauseMutation.mutate(!restaurant.is_open)}
              >
                {restaurant.is_open ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Abrir
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
