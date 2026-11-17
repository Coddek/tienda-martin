/**
 * Códigos de barras de las cajas (EAN-13 / EAN-8 / UPC). El último dígito es
 * de control: si no cierra, la lectura o lo tipeado tiene un error.
 */
export function isValidBarcode(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  // Desde la derecha: pesos 3, 1, 3, 1…
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Deja solo los dígitos (lo tipeado puede venir con espacios, como en la etiqueta). */
export const cleanBarcode = (value: string) => value.replace(/\D/g, "");
