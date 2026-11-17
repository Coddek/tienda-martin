"use client";

import type { ProductVariant } from "@/data/products";

type Props = {
  variants: ProductVariant[];
  value: number;
  onChange: (index: number) => void;
  label: string;
};

/** Botones redondos para elegir el color del modelo; al tocar cambia la foto. */
export function ColorPicker({ variants, value, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      {variants.map((variant, i) => (
        <button
          key={variant.color}
          type="button"
          aria-pressed={i === value}
          aria-label={`${label} ${variant.color}`}
          title={variant.color}
          onClick={() => onChange(i)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            i === value ? "border-ink" : "border-transparent"
          }`}
        >
          {/* El color del botón es un dato del producto, no de la identidad del sitio. */}
          <span
            className="block h-6 w-6 rounded-full border border-ink-soft"
            style={{ backgroundColor: variant.swatch }}
          />
        </button>
      ))}
      <span className="ml-1 text-sm text-ink-soft">{variants[value]?.color}</span>
    </div>
  );
}
