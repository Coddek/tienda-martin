"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { ProductCard, type ProductCardLabels } from "./ProductCard";

type Props = {
  products: Product[];
  categories: string[];
  allLabel: string;
  labels: ProductCardLabels;
  whatsapp: string;
  locale: string;
};

/** Grilla del catálogo con filtro por categoría. Sin animaciones: acá se viene a buscar rápido. */
export function CatalogGrid({ products, categories, allLabel, labels, whatsapp, locale }: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const visible = category ? products.filter((p) => p.category === category) : products;

  const chip = (label: string, value: string | null) => {
    const active = category === value;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={active}
        onClick={() => setCategory(value)}
        className={`min-h-11 rounded-full border px-5 text-sm font-medium whitespace-nowrap transition-colors ${
          active ? "border-ink bg-ink text-paper" : "border-ink-soft text-ink hover:border-ink"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="sticky top-[60px] z-20 -mx-5 flex gap-2 overflow-x-auto bg-paper [scrollbar-width:none] px-5 py-3 lg:top-[76px] lg:mx-0 lg:px-0">
        {chip(allLabel, null)}
        {categories.map((name) => chip(name, name))}
      </div>

      <div className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
        {visible.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            labels={labels}
            whatsapp={whatsapp}
            locale={locale}
            eager={i < 3}
          />
        ))}
      </div>
    </>
  );
}
