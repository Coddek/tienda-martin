"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { whatsappLink } from "@/lib/whatsapp";
import { SizePicker } from "./SizePicker";

type Props = {
  product: Product;
  whatsapp: string;
  labels: {
    sizeLabel: string;
    pickSize: string;
    soldOut: string;
    cta: string;
    whatsappMessage: string;
    share: string;
    shared: string;
  };
};

/** Parte interactiva de la página de producto: talle, consulta por WhatsApp y compartir. */
export function ProductBuyBox({ product, whatsapp, labels }: Props) {
  const [size, setSize] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const href =
    size === null
      ? undefined
      : whatsappLink(whatsapp, labels.whatsappMessage, {
          producto: product.name,
          ref: product.ref,
          talle: String(size),
        });

  // En celular abre el menú de compartir del teléfono (Instagram, WhatsApp…);
  // donde no existe, copia el enlace.
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // La persona cerró el menú o el navegador no dejó copiar: no hay nada que hacer.
    }
  };

  return (
    <div>
      <SizePicker
        sizes={product.sizes}
        value={size}
        onChange={setSize}
        label={labels.sizeLabel}
        soldOutLabel={labels.soldOut}
        large
      />

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 flex-1 items-center justify-center rounded-full bg-rust px-8 text-center text-base font-semibold tracking-[0.08em] text-paper uppercase"
          >
            {labels.cta} · {labels.sizeLabel} {size}
          </a>
        ) : (
          <p className="inline-flex min-h-14 flex-1 items-center justify-center rounded-full border border-dashed border-ink-soft px-8 text-base font-medium tracking-[0.08em] text-ink-soft uppercase">
            {labels.pickSize}
          </p>
        )}
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-14 items-center justify-center rounded-full border border-ink px-8 text-base font-semibold tracking-[0.08em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper"
        >
          <span aria-live="polite">{copied ? labels.shared : labels.share}</span>
        </button>
      </div>
    </div>
  );
}
