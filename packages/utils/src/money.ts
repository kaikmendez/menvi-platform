/** Formata valor numérico (ou string numérica) como BRL — R$ 12,34. */
export function formatBRL(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte string "R$ 12,34" ou "12,34" para número. */
export function parseBRL(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

/** Retorna valor em centavos (inteiro) a partir de um valor BRL. */
export function centsFromBRL(value: number | string): number {
  const n = typeof value === 'string' ? parseBRL(value) : value;
  return Math.round(n * 100);
}
