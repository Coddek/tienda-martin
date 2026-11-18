import { leerPorcentaje, PASOS_REDONDEO, precioSugerido, redondearArriba } from "@/lib/pricing";
import { Field, formatPesos, inputClass } from "./ui";

export type PriceValues = {
  /** Costo de lista, solo dígitos ("" = sin cargar). */
  costo: string;
  /** % propio del modelo ("" = usa el general). */
  margen: string;
  /** Precio de venta, solo dígitos. */
  precio: string;
};

const digits = (v: string) => v.replace(/\D/g, "");

/** Lo que se guarda en la base a partir de lo tipeado. */
export function priceFields(values: PriceValues) {
  return {
    costo: Number(values.costo) > 0 ? Number(values.costo) : null,
    margen: leerPorcentaje(values.margen),
    precio: Number(values.precio),
  };
}

/**
 * Costo + % de ganancia → precio sugerido. El precio se completa solo mientras
 * no lo toquen; si lo cambian a mano (42.250 → 42.300), se respeta.
 */
export function PriceFields({
  values,
  onChange,
  margenGeneral,
}: {
  values: PriceValues;
  onChange: (values: PriceValues) => void;
  margenGeneral: number;
}) {
  const sugeridoDe = (v: PriceValues) => precioSugerido(Number(v.costo), leerPorcentaje(v.margen) ?? margenGeneral);
  const sugerido = sugeridoDe(values);
  const margenUsado = leerPorcentaje(values.margen) ?? margenGeneral;

  /** Cambia costo o margen y arrastra el precio si seguía siendo el sugerido. */
  const update = (patch: Partial<PriceValues>) => {
    const next = { ...values, ...patch };
    const nuevo = sugeridoDe(next);
    const seguiaSugerido = values.precio === "" || Number(values.precio) === sugerido;
    onChange(nuevo != null && seguiaSugerido ? { ...next, precio: String(nuevo) } : next);
  };

  const precio = Number(values.precio);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Costo de lista" hint="Lo que lo pagaron. No se ve en la página.">
          <input
            inputMode="numeric"
            value={values.costo}
            onChange={(e) => update({ costo: digits(e.target.value) })}
            placeholder="20000"
            className={inputClass}
          />
        </Field>
        <Field label="Ganancia %" hint={values.margen === "" ? `Usa el general (${margenGeneral}%).` : "Solo para este modelo."}>
          <input
            inputMode="decimal"
            value={values.margen}
            onChange={(e) => update({ margen: e.target.value.replace(/[^\d.,]/g, "") })}
            placeholder={String(margenGeneral)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Precio de venta">
        <input
          inputMode="numeric"
          value={values.precio}
          onChange={(e) => onChange({ ...values, precio: digits(e.target.value) })}
          placeholder="42000"
          className={`${inputClass} text-lg font-semibold`}
        />
      </Field>

      {sugerido != null ? (
        <p className="-mt-1 text-xs text-ink-soft">
          {precio === sugerido ? (
            <>Costo + {margenUsado}% = {formatPesos(sugerido)}.</>
          ) : (
            <>
              Con costo + {margenUsado}% daría {formatPesos(sugerido)}.{" "}
              <button
                type="button"
                onClick={() => onChange({ ...values, precio: String(sugerido) })}
                className="min-h-11 font-semibold text-ink underline underline-offset-4"
              >
                Usar ese
              </button>
            </>
          )}
        </p>
      ) : null}

      {precio > 0 ? (
        <div className="-mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span>Redondear para arriba:</span>
          {PASOS_REDONDEO.map((paso) => {
            const r = redondearArriba(precio, paso);
            return (
              <button
                key={paso}
                type="button"
                disabled={r === precio}
                onClick={() => onChange({ ...values, precio: String(r) })}
                className="min-h-11 rounded-full border border-ink-soft px-3 font-medium text-ink disabled:opacity-40"
              >
                {formatPesos(r)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
