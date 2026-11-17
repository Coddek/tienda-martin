"use client";

import { useEffect } from "react";
import type { Product } from "@/data/products";
import { FAVORITES_FILTER, rememberCatalogUrl, useCatalogQuery } from "@/lib/catalogQuery";
import { useFavorites } from "@/lib/favorites";
import { ProductCard, type ProductCardLabels } from "./ProductCard";

type SortKey = "destacados" | "novedades" | "menor" | "mayor";

type Props = {
  products: Product[];
  categories: string[];
  sizes: number[];
  allLabel: string;
  sizeFilterLabel: string;
  emptyLabel: string;
  sortLabel: string;
  sortOptions: Record<SortKey, string>;
  favoritesLabels: { filter: string; empty: string };
  labels: ProductCardLabels;
  whatsapp: string;
  locale: string;
};

/**
 * Grilla del catálogo. Filtros que se combinan: categoría (o favoritos) y "tu
 * talle"; más un orden. Con un talle elegido solo se ven los modelos que lo
 * tienen en stock, y ese talle ya viene marcado en cada tarjeta.
 */
export function CatalogGrid({
  products,
  categories,
  sizes,
  allLabel,
  sizeFilterLabel,
  emptyLabel,
  sortLabel,
  sortOptions,
  favoritesLabels,
  labels,
  whatsapp,
  locale,
}: Props) {
  // Los filtros viven en la URL (ver catalogQuery): se comparten y vuelven al regresar.
  const { query, setQuery } = useCatalogQuery();
  const filter = query.cat; // null = todos; FAVORITES = solo favoritos; otro = esa categoría
  const size = query.talle;
  const sort: SortKey =
    query.orden && query.orden in sortOptions ? (query.orden as SortKey) : "destacados";
  const setFilter = (cat: string | null) => setQuery({ cat });
  const setSize = (talle: number | null) => setQuery({ talle });
  const setSort = (orden: SortKey) => setQuery({ orden: orden === "destacados" ? null : orden });
  const favorites = useFavorites();
  const FAVORITES = FAVORITES_FILTER;

  // Si la persona abre un producto sin tocar filtros, "Volver" igual sabe a dónde ir.
  useEffect(() => rememberCatalogUrl(), []);

  const visible = products
    .filter(
      (p) =>
        (filter === null ||
          (filter === FAVORITES ? favorites.some((f) => f.id === p.id) : p.category === filter)) &&
        (size === null || p.sizes.some((s) => s.size === size && s.available)),
    )
    .sort((a, b) => {
      if (sort === "menor") return a.price - b.price;
      if (sort === "mayor") return b.price - a.price;
      if (sort === "novedades") return Number(b.tag === "nuevo") - Number(a.tag === "nuevo");
      return 0;
    });

  const chipClass = (active: boolean) =>
    `min-h-11 rounded-full border px-5 text-sm font-medium whitespace-nowrap transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-ink-soft text-ink hover:border-ink"
    }`;
  const chip = (label: string, value: string | null) => (
    <button
      key={label}
      type="button"
      aria-pressed={filter === value}
      onClick={() => setFilter(value)}
      className={chipClass(filter === value)}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="sticky top-(--header-h) z-20 -mx-5 bg-paper px-5 py-3 lg:mx-0 lg:px-0">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {chip(allLabel, null)}
          {categories.map((name) => chip(name, name))}
          {chip(`♥ ${favoritesLabels.filter}${favorites.length ? ` (${favorites.length})` : ""}`, FAVORITES)}
        </div>
        {/* relative: el texto oculto "Ordenar" (sr-only) queda dentro de la fila y no
            estira la página hacia la derecha en el celular. */}
        <div className="relative -mx-5 mt-2 flex items-center gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0">
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
                className={`h-10 min-w-10 shrink-0 rounded-full border px-2 text-sm font-medium transition-colors ${
                  active ? "border-rust bg-rust text-paper" : "border-ink-soft text-ink hover:border-ink"
                }`}
              >
                {value}
              </button>
            );
          })}
          <label className="ml-auto flex shrink-0 items-center gap-2 pl-3 text-sm text-ink-soft">
            <span className="sr-only lg:not-sr-only">{sortLabel}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label={sortLabel}
              className="h-10 rounded-full border border-ink-soft bg-paper px-3 text-sm font-medium text-ink"
            >
              {(Object.keys(sortOptions) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {sortOptions[key]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-mint-soft px-6 py-10 text-center text-ink-soft">
          {filter === FAVORITES && favorites.length === 0 ? favoritesLabels.empty : emptyLabel}
        </p>
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
