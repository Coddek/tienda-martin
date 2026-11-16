/**
 * Arma el enlace de WhatsApp con el mensaje ya escrito.
 * Si todavía no hay número cargado, WhatsApp deja elegir el contacto.
 */
export function whatsappLink(number: string, template: string, values: Record<string, string>) {
  const text = template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatPrice(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
