"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { colorName, isAvailable, type Product, type ProductTag } from "@/data/products";
import { updateFavorite } from "@/lib/favorites";
import { whatsappLink } from "@/lib/whatsapp";
import { ColorPicker } from "./ColorPicker";
import { FavoriteButton } from "./FavoriteButton";
import { SizePicker, type SizePickerLabels } from "./SizePicker";

type Props = {
  product: Product;
  /** Precios ya formateados. */
  price: string;
  compareAtPrice?: string;
  whatsapp: string;
  labels: {
    tags: Record<ProductTag, string>;
    colorLabel: string;
    addFavorite: string;
    removeFavorite: string;
    sizeLabel: string;
    pickSize: string;
    sizePicker: SizePickerLabels;
    cta: string;
    whatsappMessage: string;
    share: string;
    shared: string;
  };
  /** Contenido fijo debajo de los botones (cómo comprar). */
  children?: ReactNode;
};

/** Ficha de producto: foto grande que cambia con el color, talle, WhatsApp, favorito y compartir. */
export function ProductDetail({ product, price, compareAtPrice, whatsapp, labels, children }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const variant = product.variants[variantIndex] ?? product.variants[0];
  const image = variant.image;
  const color = colorName(product, variant);
  // Al cambiar de color, el talle elegido sigue solo si ese color lo tiene.
  const size =
    picked != null && variant.sizes.some((s) => s.size === picked && isAvailable(s)) ? picked : null;

  const href =
    size === null
      ? undefined
      : whatsappLink(whatsapp, labels.whatsappMessage, {
          producto: color ? `${product.name} ${color}` : product.name,
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
    <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14">
      <div className="relative">
        <div className="product-tile relative aspect-[4/3] overflow-hidden rounded-[2rem]">
          <span className="tile-shadow absolute inset-x-[16%] bottom-[8%] h-[11%]" />
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 92vw"
            className="object-contain p-8 lg:p-14"
          />
          {product.tag ? (
            <span
              className={`absolute top-4 left-4 rounded-full px-4 py-1.5 text-sm font-semibold tracking-[0.1em] text-paper uppercase ${
                product.tag === "oferta" ? "bg-rust" : "bg-ink"
              }`}
            >
              {labels.tags[product.tag]}
            </span>
          ) : null}
        </div>
        <FavoriteButton
          id={product.id}
          size={size}
          color={color}
          addLabel={labels.addFavorite}
          removeLabel={labels.removeFavorite}
          className="absolute top-3 right-3 h-12 w-12"
        />
      </div>

      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-ink-soft uppercase">
          {product.category} · Ref. {product.ref}
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] text-ink lg:text-7xl">
          {product.name}
        </h1>
        <p className="mt-5 flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-ink">{price}</span>
          {compareAtPrice ? (
            <span className="text-lg text-ink-soft line-through">{compareAtPrice}</span>
          ) : null}
        </p>

        {product.variants.length > 1 ? (
          <div className="mt-6">
            <ColorPicker
              variants={product.variants}
              value={variantIndex}
              label={labels.colorLabel}
              onChange={(index) => {
                setVariantIndex(index);
                updateFavorite(product.id, { color: product.variants[index]?.color ?? null });
              }}
            />
          </div>
        ) : null}

        <div className="mt-6">
          <SizePicker
            sizes={variant.sizes}
            value={size}
            onChange={(next) => {
              setPicked(next);
              updateFavorite(product.id, { size: next });
            }}
            labels={labels.sizePicker}
            large
          />
        </div>

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

        {children}
      </div>
    </div>
  );
}
