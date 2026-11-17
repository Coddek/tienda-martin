/**
 * Arma el enlace de WhatsApp con el mensaje ya escrito.
 * Si todavía no hay número cargado, WhatsApp deja elegir el contacto.
 */
export function whatsappLink(number: string, template: string, values: Record<string, string>) {
  const text = template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Enlace completo a la ficha del producto, para mandarlo en el mensaje: quien
 * atiende lo toca y ve la foto sin buscar por referencia. Se usa solo en el
 * navegador (al armar el mensaje), donde se conoce la dirección del sitio.
 */
export function productUrl(id: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/producto/${id}`;
}

export function formatPrice(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
