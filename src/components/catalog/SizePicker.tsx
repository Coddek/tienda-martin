"use client";

import type { ProductSize } from "@/data/products";

type Props = {
  sizes: ProductSize[];
  value: number | null;
  onChange: (size: number | null) => void;
  label: string;
  soldOutLabel: string;
  /** Botones más grandes (página de producto). */
  large?: boolean;
};

/** Selector de talle. Los talles sin stock se ven tachados y no se pueden elegir. */
export function SizePicker({ sizes, value, onChange, label, soldOutLabel, large }: Props) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map(({ size, available }) => {
          const selected = value === size;
          return (
            <button
              key={size}
              type="button"
              disabled={!available}
              aria-pressed={selected}
              aria-label={available ? `${label} ${size}` : `${label} ${size}: ${soldOutLabel}`}
              onClick={() => onChange(selected ? null : size)}
              className={`rounded-full border font-medium transition-colors ${
                large ? "h-13 min-w-13 px-4 text-base" : "h-11 min-w-11 px-3 text-sm"
              } ${
                selected
                  ? "border-ink bg-ink text-paper"
                  : available
                    ? "border-ink-soft text-ink hover:border-ink"
                    : "cursor-not-allowed border-mint text-ink-soft line-through opacity-60"
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
