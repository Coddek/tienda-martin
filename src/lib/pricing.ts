/**
 * Precio de venta a partir del costo de lista: costo + % de ganancia
 * (110 % → costo × 2,1). Es solo una sugerencia: el precio final se edita libre.
 * Misma cuenta que tienda_recalcular_precios en supabase/tienda.sql.
 */
export function precioSugerido(costo: number, margen: number, redondeo = 1) {
  if (!(costo > 0) || !(margen >= 0)) return null;
  // Se redondea a centavos antes de subir al múltiplo: evita que 20000 × 2,1
  // dé 42000,0000001 y salte a 42100.
  const exacto = Math.round(costo * (1 + margen / 100) * 100) / 100;
  return redondearArriba(exacto, redondeo);
}

/** Precio ± un %, redondeado para arriba (misma cuenta que tienda_ajustar_precios). */
export function aplicarPorcentaje(precio: number, porcentaje: number, redondeo = 1) {
  return redondearArriba(Math.round(precio * (1 + porcentaje / 100) * 100) / 100, redondeo);
}

/** Para arriba, al múltiplo de `paso` (1 = al peso). */
export function redondearArriba(valor: number, paso: number) {
  const p = Math.max(1, Math.round(paso));
  return Math.ceil(valor / p) * p;
}

/** "110", "110,5" o "" → número; "" o inválido → null. */
export function leerPorcentaje(texto: string): number | null {
  const limpio = texto.replace(",", ".").replace(/[^\d.]/g, "");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 && n <= 1000 ? n : null;
}

export const PASOS_REDONDEO = [100, 500, 1000] as const;
