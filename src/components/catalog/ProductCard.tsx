"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product, ProductTag } from "@/data/products";
import { updateFavorite } from "@/lib/favorites";
import { formatPrice, whatsappLink } from "@/lib/whatsapp";
import { ColorPicker } from "./ColorPicker";
import { FavoriteButton } from "./FavoriteButton";
import { SizePicker } from "./SizePicker";

export type ProductCardLabels = {
  tags: Record<ProductTag, string>;
  viewProduct: string;
  colorLabel: string;
  addFavorite: string;
  removeFavorite: string;
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
  /** Talle elegido en el filtro del catálogo: viene ya marcado si hay stock. */
  preferredSize?: number | null;
  /** Las primeras tarjetas cargan la foto sin esperar al scroll. */
  eager?: boolean;
};

/** Tarjeta de producto: foto, color, precio, talles, favorito y consulta por WhatsApp precargada. */
export function ProductCard({ product, labels, whatsapp, locale, preferredSize, eager }: Props) {
  // undefined = la persona todavía no tocó nada en esta tarjeta.
  const [picked, setPicked] = useState<number | null | undefined>(undefined);
  const [variantIndex, setVariantIndex] = useState(0);
  // Hasta que llega la foto, la tarjeta muestra un brillo (así no parece vacía).
  const [loaded, setLoaded] = useState(false);

  const preferredAvailable =
    preferredSize != null && product.sizes.some((s) => s.size === preferredSize && s.available);
  const size = picked !== undefined ? picked : preferredAvailable ? preferredSize : null;
  const variant = product.variants?.[variantIndex];
  const image = variant?.image ?? product.image;
  const color = variant?.color ?? null;

  const productHref = `/producto/${product.id}`;
  const href =
    size == null
      ? undefined
      : whatsappLink(whatsapp, labels.whatsappMessage, {
          producto: color ? `${product.name} ${color}` : product.name,
          ref: product.ref,
          talle: String(size),
        });

  return (
    <article id={product.id} className="card-reveal flex scroll-mt-40 flex-col">
      <div className="relative">
        <Link
          href={productHref}
          aria-label={`${labels.viewProduct}: ${product.name}`}
          className={`product-tile group relative block aspect-[4/3] overflow-hidden rounded-3xl ${
            loaded ? "" : "tile-loading"
          }`}
        >
          <span className="tile-shadow absolute inset-x-[16%] bottom-[8%] h-[11%] transition-transform duration-500 group-hover:scale-x-90" />
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            loading={eager ? "eager" : "lazy"}
            onLoad={() => setLoaded(true)}
            className="object-contain p-7 transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.06] group-hover:-rotate-2"
          />
          {product.tag ? (
            <span
              className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.1em] text-paper uppercase ${
                product.tag === "oferta" ? "bg-rust" : "bg-ink"
              }`}
            >
              {labels.tags[product.tag]}
            </span>
          ) : null}
        </Link>
        <FavoriteButton
          id={product.id}
          size={size ?? null}
          color={color}
          addLabel={labels.addFavorite}
          removeLabel={labels.removeFavorite}
          className="absolute top-2 right-2"
        />
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-2xl leading-tight text-ink lg:text-[1.7rem]">
          <Link href={productHref} className="hover:underline hover:decoration-1 hover:underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <p className="text-right whitespace-nowrap">
          {product.compareAtPrice ? (
            <span className="mr-2 text-sm text-ink-soft line-through">
              {formatPrice(product.compareAtPrice, locale)}
            </span>
          ) : null}
          <span className="text-lg font-semibold text-ink">{formatPrice(product.price, locale)}</span>
        </p>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {product.category} · Ref. {product.ref}
      </p>

      <div className="mt-3 mb-3 min-h-9">
        {product.variants ? (
          <ColorPicker
            variants={product.variants}
            value={variantIndex}
            label={labels.colorLabel}
            onChange={(index) => {
              setVariantIndex(index);
              updateFavorite(product.id, { color: product.variants?.[index]?.color ?? null });
            }}
          />
        ) : null}
      </div>

      <SizePicker
        sizes={product.sizes}
        value={size ?? null}
        onChange={(next) => {
          setPicked(next);
          updateFavorite(product.id, { size: next });
        }}
        label={labels.sizeLabel}
        soldOutLabel={labels.soldOut}
      />

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-rust px-6 text-center text-sm font-semibold tracking-[0.08em] text-paper uppercase"
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
