import type { ReactNode } from "react";

/** Piezas chicas del editor: mismo estilo que la página, pensado para el dedo (44 px o más). */

export const btn = {
  primary:
    "inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 font-semibold text-paper disabled:opacity-50",
  cta: "inline-flex min-h-13 items-center justify-center rounded-2xl bg-rust px-5 font-semibold tracking-[0.04em] text-paper uppercase disabled:opacity-50",
  secondary:
    "inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink-soft px-5 font-medium text-ink hover:border-ink disabled:opacity-50",
  link: "inline-flex min-h-11 items-center text-sm font-medium text-ink-soft underline underline-offset-4",
};

export const inputClass =
  "min-h-12 w-full rounded-2xl border border-ink-soft bg-paper px-4 text-base text-ink placeholder:text-ink-soft/60";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-mint bg-paper p-5 ${className}`}>{children}</div>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? (
    <p role="alert" className="rounded-2xl bg-rust/10 px-4 py-3 text-sm font-medium text-rust">
      {children}
    </p>
  ) : null;
}

/** Talles argentinos a mano; el que no esté se puede tipear. */
const SIZES = [33, 34, 35, 36, 37, 38, 39, 40, 41, 42];

export function SizeGrid({
  value,
  onChange,
  stockBySize,
}: {
  value: number | null;
  onChange: (size: number) => void;
  /** Stock actual de cada talle, para mostrarlo debajo. */
  stockBySize?: Record<number, number>;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {SIZES.map((size) => (
        <button
          key={size}
          type="button"
          aria-pressed={value === size}
          onClick={() => onChange(size)}
          className={`flex min-h-12 flex-col items-center justify-center rounded-2xl border text-base font-semibold ${
            value === size ? "border-ink bg-ink text-paper" : "border-ink-soft text-ink"
          }`}
        >
          {size}
          {stockBySize && stockBySize[size] !== undefined ? (
            <span className={`text-[0.65rem] font-medium ${value === size ? "text-mint" : "text-ink-soft"}`}>
              hay {stockBySize[size]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`Restar ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-12 w-12 rounded-2xl border border-ink-soft text-2xl leading-none"
      >
        −
      </button>
      <span aria-live="polite" className="min-w-10 text-center text-2xl font-semibold">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Sumar ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-12 w-12 rounded-2xl border border-ink-soft text-2xl leading-none"
      >
        +
      </button>
    </div>
  );
}

export const formatPesos = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
