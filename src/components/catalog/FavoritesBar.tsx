"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { clearFavorites, removeFavorite, useFavorites } from "@/lib/favorites";
import { productUrl } from "@/lib/whatsapp";

/** Lo mínimo de cada modelo para listarlo y armar el mensaje. */
export type FavoriteProduct = {
  id: string;
  name: string;
  ref: string;
  /** Foto de cada color (clave = nombre del color) y la principal. */
  photos: Record<string, string>;
  photo: string;
};

type Props = {
  products: FavoriteProduct[];
  whatsapp: string;
  labels: {
    consult: string;
    panelTitle: string;
    panelHint: string;
    consultAll: string;
    removeOne: string;
    clear: string;
    clearConfirm: string;
    clearYes: string;
    clearCancel: string;
    close: string;
    view: string;
    messageIntro: string;
    messageLine: string;
    noSize: string;
  };
  sizeLabel: string;
};

/**
 * Botón que aparece cuando hay favoritos guardados. Despliega la lista (foto,
 * color y talle de cada uno) para quitar los que ya no interesan, y desde ahí
 * se consulta todo junto por WhatsApp. Es lo más parecido a un carrito sin pago online.
 * En celular el panel sube desde abajo; en escritorio se abre sobre el botón.
 */
export function FavoritesBar({ products, whatsapp, labels, sizeLabel }: Props) {
  const favorites = useFavorites();
  const dialog = useRef<HTMLDialogElement>(null);
  const inEditor = usePathname().startsWith("/admin");
  const [confirming, setConfirming] = useState(false);

  const items = favorites.flatMap((favorite) => {
    const product = products.find((p) => p.id === favorite.id);
    return product ? [{ favorite, product }] : [];
  });

  // Sin favoritos no hay botón ni panel (si se quita el último, el panel se cierra solo).
  // En el editor tampoco: ahí no se compra.
  if (items.length === 0 || inEditor) return null;

  const lines = items.map(({ favorite, product }) => {
    const values: Record<string, string> = {
      producto: favorite.color ? `${product.name} ${favorite.color}` : product.name,
      ref: product.ref,
      link: productUrl(product.id),
      talle: favorite.size ? String(favorite.size) : labels.noSize,
    };
    return labels.messageLine.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
  });
  // Una línea en blanco entre modelos: cada uno con su enlace se lee más claro.
  const text = [labels.messageIntro, ...lines].join("\n\n");
  const href = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="fixed bottom-4 left-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold tracking-[0.06em] text-paper uppercase shadow-lg lg:bottom-8 lg:left-8 lg:h-16 lg:px-7 lg:text-base"
      >
        <span aria-hidden="true" className="text-lg text-gold">
          ♥
        </span>
        {labels.consult} ({items.length})
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="favoritos-titulo"
        // Al cerrar se descarta una confirmación de "vaciar" a medio responder.
        onClose={() => setConfirming(false)}
        // Tocar afuera del panel (el fondo oscuro) lo cierra.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="favorites-panel m-0 mt-auto max-h-none w-full max-w-none rounded-t-3xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/55 lg:mb-28 lg:ml-8 lg:w-[420px] lg:rounded-3xl"
      >
        <div className="flex max-h-[80svh] flex-col lg:max-h-[70svh]">
          <div className="flex items-start justify-between gap-4 px-5 pt-5 lg:px-6">
            <div>
              <h2 id="favoritos-titulo" className="font-display text-3xl leading-tight">
                {labels.panelTitle} ({items.length})
              </h2>
              <p className="mt-1 text-sm text-ink-soft">{labels.panelHint}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-soft text-xl leading-none hover:border-ink"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {/* data-lenis-prevent: en escritorio la lista se scrollea sola, no la página de atrás. */}
          <ul data-lenis-prevent className="mt-4 flex-1 overflow-y-auto overscroll-contain px-5 lg:px-6">
            {items.map(({ favorite, product }) => {
              const photo = (favorite.color && product.photos[favorite.color]) || product.photo;
              const detail = [
                favorite.color,
                `${sizeLabel} ${favorite.size ?? labels.noSize}`,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={product.id} className="flex items-center gap-4 border-t border-mint py-3 first:border-t-0">
                  <Link
                    href={`/producto/${product.id}`}
                    onClick={close}
                    className="product-tile relative block h-16 w-20 shrink-0 overflow-hidden rounded-xl"
                    aria-label={`${labels.view}: ${product.name}`}
                  >
                    {/* eager: si no, la foto recién empieza a bajar al abrir el panel y se ve vacía un momento. */}
                    <Image src={photo} alt="" fill sizes="80px" loading="eager" className="object-contain p-1.5" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/producto/${product.id}`}
                      onClick={close}
                      className="line-clamp-2 font-display text-xl leading-tight hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-sm leading-snug text-ink-soft">{detail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFavorite(product.id)}
                    aria-label={`${labels.removeOne} ${product.name}`}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-ink-soft px-4 text-sm font-medium hover:border-rust hover:text-rust"
                  >
                    {labels.removeOne}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-mint px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-6">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-13 w-full items-center justify-center rounded-full bg-rust px-6 text-center text-sm font-semibold tracking-[0.08em] text-paper uppercase"
            >
              {labels.consultAll} ({items.length})
            </a>
            {/* Vaciar pide confirmación ahí mismo, con el estilo del sitio (no el cartel del navegador). */}
            {confirming ? (
              <div role="alert" className="mt-3 rounded-2xl bg-mint-soft px-4 py-3 text-center">
                <p className="text-sm font-medium text-ink">{labels.clearConfirm}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="min-h-11 flex-1 rounded-full border border-ink-soft text-sm font-medium text-ink hover:border-ink"
                  >
                    {labels.clearCancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      clearFavorites();
                    }}
                    className="min-h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-paper"
                  >
                    {labels.clearYes}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-2 w-full py-2 text-sm font-medium text-ink-soft underline-offset-4 hover:text-rust hover:underline"
              >
                {labels.clear}
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
