"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/data/products";
import { formatPrice, whatsappLink } from "@/lib/whatsapp";

export type ProductCardLabels = {
  sizeLabel: string;
  pickSize: string;
  soldOut: string;
  cta: string;
  whatsappMessage: string;
};

type Props = {
  product: Product;
  labels: ProductCardLabels;
  whatsapp: string;
  locale: string;
  /** Las primeras tarjetas cargan la foto sin esperar al scroll. */
  eager?: boolean;
};

/** Tarjeta de producto: foto, precio, talles y consulta por WhatsApp con todo precargado. */
export function ProductCard({ product, labels, whatsapp, locale, eager }: Props) {
  const [size, setSize] = useState<number | null>(null);
  const href =
    size === null
      ? undefined
      : whatsappLink(whatsapp, labels.whatsappMessage, {
          producto: product.name,
          ref: product.ref,
          talle: String(size),
        });

  return (
    <article className="flex flex-col">
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-mint-soft p-6">
        <Image
          src={product.image.src}
          width={product.image.width}
          height={product.image.height}
          alt={product.image.alt}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          loading={eager ? "eager" : "lazy"}
          className="max-h-full w-auto max-w-full object-contain"
        />
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl leading-tight text-ink lg:text-[1.7rem]">
          {product.name}
        </h3>
        <p className="text-lg font-semibold whitespace-nowrap text-ink">
          {formatPrice(product.price, locale)}
        </p>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {product.category} · Ref. {product.ref}
      </p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">
          {labels.sizeLabel}
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map(({ size: value, available }) => {
            const selected = size === value;
            return (
              <button
                key={value}
                type="button"
                disabled={!available}
                aria-pressed={selected}
                aria-label={available ? `${labels.sizeLabel} ${value}` : `${labels.sizeLabel} ${value}: ${labels.soldOut}`}
                onClick={() => setSize(selected ? null : value)}
                className={`h-11 min-w-11 rounded-full border px-3 text-sm font-medium transition-colors ${
                  selected
                    ? "border-ink bg-ink text-paper"
                    : available
                      ? "border-ink-soft text-ink hover:border-ink"
                      : "cursor-not-allowed border-mint text-ink-soft line-through opacity-60"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      </fieldset>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-rust px-6 text-sm font-semibold tracking-[0.08em] text-paper uppercase"
        >
          {labels.cta} · {labels.sizeLabel} {size}
        </a>
      ) : (
        <p className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-dashed border-ink-soft px-6 text-sm font-medium tracking-[0.08em] text-ink-soft uppercase">
          {labels.pickSize}
        </p>
      )}
    </article>
  );
}
