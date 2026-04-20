'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Category,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  Product,
  ProductCreatePayload,
  ProductUpdatePayload,
} from '@menvi/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@menvi/ui';
import { cn, formatBRL } from '@menvi/utils';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
} from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function CardapioPage() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null);
  const [categoryDialog, setCategoryDialog] = React.useState<
    { mode: 'create' } | { mode: 'edit'; category: Category } | null
  >(null);
  const [productDialog, setProductDialog] = React.useState<
    { mode: 'create'; categoryId: string } | { mode: 'edit'; product: Product } | null
  >(null);

  const { data: categories } = useQuery({
    queryKey: ['categories', token],
    queryFn: () => listCategories(token!),
    enabled: Boolean(token),
  });

  const { data: products } = useQuery({
    queryKey: ['products', token],
    queryFn: () => listProducts(token!),
    enabled: Boolean(token),
  });

  React.useEffect(() => {
    if (!activeCategoryId && categories && categories.length > 0) {
      const first = categories[0];
      if (first) setActiveCategoryId(first.id);
    }
  }, [categories, activeCategoryId]);

  const toggleCategoryMutation = useMutation({
    mutationFn: (c: Category) =>
      updateCategory(token!, c.id, { is_active: !c.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleProductMutation = useMutation({
    mutationFn: (p: Product) =>
      updateProduct(token!, p.id, { is_available: !p.is_available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(token!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const filteredProducts =
    activeCategoryId && products
      ? products.filter((p) => p.category_id === activeCategoryId)
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cardápio</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie categorias e produtos. Atualizações refletem no link público em tempo real.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Categorias</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCategoryDialog({ mode: 'create' })}
            >
              <Plus className="mr-1 h-3 w-3" />
              Nova
            </Button>
          </div>

          <ul className="space-y-1">
            {(categories ?? []).map((c) => {
              const active = c.id === activeCategoryId;
              return (
                <li key={c.id}>
                  <div
                    className={cn(
                      'group flex items-center justify-between gap-1 rounded-md px-2 py-1.5 text-sm',
                      active ? 'bg-primary/10 text-primary' : 'hover:bg-accent',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(c.id)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      <span className="truncate">{c.name}</span>
                      {!c.is_active ? (
                        <Badge variant="outline" className="text-[10px]">
                          inativa
                        </Badge>
                      ) : null}
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <IconButton
                        onClick={() => setCategoryDialog({ mode: 'edit', category: c })}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          if (confirm(`Excluir a categoria "${c.name}"? Produtos serão removidos.`)) {
                            deleteCategoryMutation.mutate(c.id);
                          }
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </li>
              );
            })}
            {(categories ?? []).length === 0 ? (
              <li className="py-6 text-center text-xs text-muted-foreground">
                Nenhuma categoria. Crie a primeira.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Produtos</h2>
            <div className="flex gap-2">
              {activeCategoryId ? (
                <>
                  {(() => {
                    const cat = (categories ?? []).find((c) => c.id === activeCategoryId);
                    if (!cat) return null;
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCategoryMutation.mutate(cat)}
                      >
                        {cat.is_active ? 'Pausar categoria' : 'Ativar categoria'}
                      </Button>
                    );
                  })()}
                  <Button
                    size="sm"
                    onClick={() =>
                      setProductDialog({ mode: 'create', categoryId: activeCategoryId })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Novo produto
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {!activeCategoryId ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Selecione uma categoria para ver os produtos.
              </CardContent>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Essa categoria ainda não tem produtos.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((p) => (
                <Card
                  key={p.id}
                  className={cn('overflow-hidden', !p.is_available && 'opacity-60')}
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-muted text-xs text-muted-foreground">
                      sem imagem
                    </div>
                  )}
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{p.name}</p>
                      <span className="whitespace-nowrap text-sm font-semibold">
                        {formatBRL(p.price)}
                      </span>
                    </div>
                    {p.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between pt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          p.is_available
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-muted-foreground/40 text-muted-foreground',
                        )}
                      >
                        {p.is_available ? 'Disponível' : 'Pausado'}
                      </Badge>
                      <div className="flex gap-1">
                        <IconButton
                          onClick={() => toggleProductMutation.mutate(p)}
                          title={p.is_available ? 'Pausar' : 'Ativar'}
                        >
                          {p.is_available ? (
                            <span className="text-xs">Pausar</span>
                          ) : (
                            <span className="text-xs">Ativar</span>
                          )}
                        </IconButton>
                        <IconButton
                          onClick={() => setProductDialog({ mode: 'edit', product: p })}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            if (confirm(`Excluir o produto "${p.name}"?`)) {
                              deleteProductMutation.mutate(p.id);
                            }
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <CategoryDialog
        state={categoryDialog}
        onClose={() => setCategoryDialog(null)}
        onCreated={(c) => setActiveCategoryId(c.id)}
      />
      <ProductDialog
        state={productDialog}
        categories={categories ?? []}
        onClose={() => setProductDialog(null)}
      />
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className="inline-flex h-7 items-center justify-center rounded-md px-2 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

interface CategoryDialogProps {
  state: { mode: 'create' } | { mode: 'edit'; category: Category } | null;
  onClose: () => void;
  onCreated?: (c: Category) => void;
}

function CategoryDialog({ state, onClose, onCreated }: CategoryDialogProps) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [name, setName] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (state?.mode === 'edit') {
      setName(state.category.name);
      setIsActive(state.category.is_active);
    } else if (state?.mode === 'create') {
      setName('');
      setIsActive(true);
    }
  }, [state]);

  const mutation = useMutation({
    mutationFn: async (): Promise<Category> => {
      if (!state) throw new Error('no state');
      if (state.mode === 'edit') {
        const payload: CategoryUpdatePayload = { name, is_active: isActive };
        return updateCategory(token!, state.category.id, payload);
      }
      const payload: CategoryCreatePayload = { name, is_active: isActive };
      return createCategory(token!, payload);
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      if (state?.mode === 'create' && onCreated) onCreated(created);
      onClose();
    },
  });

  return (
    <Dialog open={Boolean(state)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === 'edit' ? 'Editar categoria' : 'Nova categoria'}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Categoria ativa (aparece no cardápio público)
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProductDialogProps {
  state:
    | { mode: 'create'; categoryId: string }
    | { mode: 'edit'; product: Product }
    | null;
  categories: Category[];
  onClose: () => void;
}

function ProductDialog({ state, categories, onClose }: ProductDialogProps) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const [form, setForm] = React.useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
  });

  React.useEffect(() => {
    if (state?.mode === 'edit') {
      setForm({
        category_id: state.product.category_id,
        name: state.product.name,
        description: state.product.description ?? '',
        price: state.product.price,
        image_url: state.product.image_url ?? '',
        is_available: state.product.is_available,
      });
    } else if (state?.mode === 'create') {
      setForm({
        category_id: state.categoryId,
        name: '',
        description: '',
        price: '',
        image_url: '',
        is_available: true,
      });
    }
  }, [state]);

  const mutation = useMutation({
    mutationFn: async (): Promise<Product> => {
      if (!state) throw new Error('no state');
      const priceNormalized = form.price.replace(',', '.');
      if (state.mode === 'edit') {
        const payload: ProductUpdatePayload = {
          category_id: form.category_id,
          name: form.name,
          description: form.description || null,
          price: priceNormalized,
          image_url: form.image_url || null,
          is_available: form.is_available,
        };
        return updateProduct(token!, state.product.id, payload);
      }
      const payload: ProductCreatePayload = {
        category_id: form.category_id,
        name: form.name,
        description: form.description || null,
        price: priceNormalized,
        image_url: form.image_url || null,
        is_available: form.is_available,
      };
      return createProduct(token!, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  return (
    <Dialog open={Boolean(state)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === 'edit' ? 'Editar produto' : 'Novo produto'}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="prod-category">Categoria</Label>
              <select
                id="prod-category"
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                required
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="prod-name">Nome</Label>
              <Input
                id="prod-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                maxLength={160}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="prod-desc">Descrição</Label>
              <Textarea
                id="prod-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-price">Preço (R$)</Label>
              <Input
                id="prod-price"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0,00"
                required
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-image">URL da imagem</Label>
              <Input
                id="prod-image"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://…"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_available: e.target.checked }))
              }
            />
            Produto disponível (aparece no cardápio)
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !form.name.trim() ||
                !form.price.trim() ||
                !form.category_id
              }
            >
              {mutation.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
