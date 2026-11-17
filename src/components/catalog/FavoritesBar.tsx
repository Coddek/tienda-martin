"use client";

import { products } from "@/data/products";
import { useFavorites } from "@/lib/favorites";

type Props = {
  whatsapp: string;
  labels: {
    consult: string;
    messageIntro: string;
    messageLine: string;
    noSize: string;
  };
};

/**
 * Botón que aparece cuando hay favoritos guardados: abre WhatsApp con una sola
 * consulta que lista todos los modelos, con su color y talle. Es lo más parecido
 * a un carrito sin tener pago online.
 */
export function FavoritesBar({ whatsapp, labels }: Props) {
  const favorites = useFavorites();
  if (favorites.length === 0) return null;

  const lines = favorites.flatMap((favorite) => {
    const product = products.find((p) => p.id === favorite.id);
    if (!product) return [];
    const values: Record<string, string> = {
      producto: favorite.color ? `${product.name} ${favorite.color}` : product.name,
      ref: product.ref,
      talle: favorite.size ? String(favorite.size) : labels.noSize,
    };
    return [labels.messageLine.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)];
  });
  if (lines.length === 0) return null;

  const text = [labels.messageIntro, ...lines].join("\n");
  const href = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold tracking-[0.06em] text-paper uppercase shadow-lg lg:bottom-8 lg:left-8 lg:h-16 lg:px-7 lg:text-base"
    >
      <span aria-hidden="true" className="text-lg text-gold">
        ♥
      </span>
      {labels.consult} ({lines.length})
    </a>
  );
}
