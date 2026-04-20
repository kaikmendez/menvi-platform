/** Remove tudo que não é dígito. */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Formata telefone brasileiro: 11987654321 → (11) 98765-4321. */
export function formatPhoneBR(phone: string): string {
  const digits = sanitizePhone(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
