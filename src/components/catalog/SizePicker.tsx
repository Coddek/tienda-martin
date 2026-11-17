"use client";

import { isAvailable, type ProductSize } from "@/data/products";

export type SizePickerLabels = {
  label: string;
  soldOut: string;
  /** Aviso corto debajo del botón cuando queda poco. */
  lowShort: { ultimo: string; quedan2: string };
  /** Aviso completo al elegir un talle con poco stock. */
  low: { ultimo: string; quedan2: string };
  /** Sigla del talle brasileño, que figura en la etiqueta de la caja. */
  brLabel: string;
  arLabel: string;
};

type Props = {
  sizes: ProductSize[];
  value: number | null;
  onChange: (size: number | null) => void;
  labels: SizePickerLabels;
  /** Botones más grandes (página de producto). */
  large?: boolean;
};

/**
 * Selector de talle (argentino). Sin stock: tachado y sin poder elegirse. Con
 * poco stock: un aviso corto debajo ("Último"). Al elegir, una línea muestra el
 * equivalente brasileño (el de la etiqueta) y cuánto queda.
 */
export function SizePicker({ sizes, value, onChange, labels, large }: Props) {
  const selected = sizes.find((s) => s.size === value);
  const low =
    selected && (selected.stock === "ultimo" || selected.stock === "quedan2")
      ? labels.low[selected.stock]
      : null;

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">
        {labels.label}
      </legend>
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {sizes.map((item) => {
          const { size, stock } = item;
          const available = isAvailable(item);
          const active = value === size;
          const short = stock === "ultimo" || stock === "quedan2" ? labels.lowShort[stock] : null;
          return (
            <span key={size} className="flex flex-col items-center">
              <button
                type="button"
                disabled={!available}
                aria-pressed={active}
                aria-label={
                  available
                    ? `${labels.label} ${size}${short ? `, ${labels.low[stock as "ultimo" | "quedan2"]}` : ""}`
                    : `${labels.label} ${size}: ${labels.soldOut}`
                }
                onClick={() => onChange(active ? null : size)}
                className={`rounded-full border font-medium transition-colors ${
                  large ? "h-13 min-w-13 px-4 text-base" : "h-11 min-w-11 px-3 text-sm"
                } ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : available
                      ? "border-ink-soft text-ink hover:border-ink"
                      : "cursor-not-allowed border-mint text-ink-soft line-through opacity-60"
                }`}
              >
                {size}
              </button>
              {/* Siempre ocupa su lugar, así los botones quedan alineados. */}
              <span
                aria-hidden="true"
                className="h-4 text-[0.65rem] leading-4 font-semibold tracking-[0.04em] whitespace-nowrap text-rust uppercase"
              >
                {short}
              </span>
            </span>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-1 min-h-5 text-sm text-ink-soft">
        {selected ? (
          <>
            {labels.label} {selected.size} {labels.arLabel}
            {selected.sizeBr != null ? ` (${selected.sizeBr} ${labels.brLabel})` : ""}
            {low ? <span className="font-semibold text-rust"> · {low}</span> : null}
          </>
        ) : null}
      </p>
    </fieldset>
  );
}
