"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { ProductCard, type ProductCardLabels } from "./ProductCard";

type Props = {
  products: Product[];
  categories: string[];
  sizes: number[];
  allLabel: string;
  sizeFilterLabel: string;
  emptyLabel: string;
  labels: ProductCardLabels;
  whatsapp: string;
  locale: string;
};

/**
 * Grilla del catálogo con dos filtros que se combinan: categoría y "tu talle".
 * Con un talle elegido solo se ven los modelos que lo tienen en stock, y ese
 * talle ya viene marcado en cada tarjeta.
 */
export function CatalogGrid({
  products,
  categories,
  sizes,
  allLabel,
  sizeFilterLabel,
  emptyLabel,
  labels,
  whatsapp,
  locale,
}: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const [size, setSize] = useState<number | null>(null);

  const visible = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (size === null || p.sizes.some((s) => s.size === size && s.available)),
  );

  const chipClass = (active: boolean) =>
    `min-h-11 rounded-full border px-5 text-sm font-medium whitespace-nowrap transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-ink-soft text-ink hover:border-ink"
    }`;

  return (
    <>
      <div className="sticky top-[60px] z-20 -mx-5 bg-paper px-5 py-3 lg:top-[72px] lg:mx-0 lg:px-0">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0">
          <button
            type="button"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
            className={chipClass(category === null)}
          >
            {allLabel}
          </button>
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className={chipClass(category === name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="-mx-5 mt-2 flex items-center gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0">
          <span className="mr-1 text-xs font-medium tracking-[0.14em] whitespace-nowrap text-ink-soft uppercase">
            {sizeFilterLabel}
          </span>
          {sizes.map((value) => {
            const active = size === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                aria-label={`${sizeFilterLabel} ${value}`}
                onClick={() => setSize(active ? null : value)}
                className={`h-10 min-w-10 rounded-full border px-2 text-sm font-medium transition-colors ${
                  active ? "border-rust bg-rust text-paper" : "border-ink-soft text-ink hover:border-ink"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-mint-soft px-6 py-10 text-center text-ink-soft">{emptyLabel}</p>
      ) : (
        <div className="mt-6 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
          {visible.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              labels={labels}
              whatsapp={whatsapp}
              locale={locale}
              preferredSize={size}
              eager={i < 3}
            />
          ))}
        </div>
      )}
    </>
  );
}
