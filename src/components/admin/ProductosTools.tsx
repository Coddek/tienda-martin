import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import {
  ajustarPrecios,
  guardarAjustes,
  ordenar,
  recalcularPrecios,
  type Producto,
} from "@/lib/admin-data";
import { aplicarPorcentaje, leerPorcentaje, PASOS_REDONDEO, precioSugerido } from "@/lib/pricing";
import { photoPublicUrl } from "@/lib/supabase-browser";
import { btn, Card, ErrorText, Field, formatPesos, inputClass } from "./ui";

/** Orden del catálogo: igual al de la tienda (destacados incluidos). */
export const byOrden = (a: Producto, b: Producto) => a.orden - b.orden || a.nombre.localeCompare(b.nombre);

const thumb = (p: Producto) => p.colores.find((c) => c.foto_path)?.foto_path;

/** Mover uno de lugar en una lista. */
export function moved<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Fila con flechas para ordenar (en el celular es más seguro que arrastrar). */
export function OrderRow({
  producto,
  index,
  total,
  onMove,
  action,
}: {
  producto: Producto;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  /** Un botón más al final (ej. sacar de destacados). */
  action?: ReactNode;
}) {
  const photo = thumb(producto);
  return (
    <li className="flex items-center gap-2 rounded-3xl border border-mint bg-paper p-2">
      {/* Con un botón más no entra el número: el orden se ve igual de arriba hacia abajo. */}
      {action ? null : <span className="w-6 shrink-0 text-center text-sm font-semibold text-ink-soft">{index + 1}</span>}
      <span className="product-tile relative block h-11 w-12 shrink-0 overflow-hidden rounded-xl">
        {photo ? <Image src={photoPublicUrl(photo)} alt="" fill sizes="48px" className="object-contain p-1" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm leading-tight font-medium break-words">{producto.nombre}</span>
        {!producto.activo ? <span className="text-xs text-ink-soft">Oculto</span> : null}
      </span>
      <button
        type="button"
        disabled={index === 0}
        aria-label={`Subir ${producto.nombre}`}
        onClick={() => onMove(index, index - 1)}
        className="h-11 w-10 shrink-0 rounded-2xl border border-ink-soft text-lg disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        aria-label={`Bajar ${producto.nombre}`}
        onClick={() => onMove(index, index + 1)}
        className="h-11 w-10 shrink-0 rounded-2xl border border-ink-soft text-lg disabled:opacity-30"
      >
        ↓
      </button>
      {action}
    </li>
  );
}

/** Orden de todo el catálogo. */
export function OrdenarView({
  productos,
  onSaved,
  onClose,
}: {
  productos: Producto[];
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [list, setList] = useState(() => [...productos].sort(byOrden));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = list.some((p, i) => p.id !== [...productos].sort(byOrden)[i]?.id);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await ordenar(list.map((p) => p.id));
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el orden.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onClose} className={`${btn.link} self-start`}>
        ← Volver a la lista
      </button>
      <h2 className="font-display text-3xl">Orden del catálogo</h2>
      <p className="-mt-2 text-sm text-ink-soft">Así aparecen en la página, de arriba hacia abajo.</p>
      <ErrorText>{error}</ErrorText>
      <ol className="flex flex-col gap-2">
        {list.map((p, i) => (
          <OrderRow key={p.id} producto={p} index={i} total={list.length} onMove={(a, b) => setList(moved(list, a, b))} />
        ))}
      </ol>
      <div className="sticky bottom-20 flex gap-2 bg-paper/95 py-2">
        <button type="button" onClick={onClose} className={`${btn.secondary} flex-1`}>
          Cancelar
        </button>
        <button type="button" disabled={!changed || saving} onClick={save} className={`${btn.primary} flex-1`}>
          {saving ? "Guardando…" : "Guardar orden"}
        </button>
      </div>
    </div>
  );
}

const REDONDEOS = [{ paso: 1, label: "Al peso" }, ...PASOS_REDONDEO.map((paso) => ({ paso, label: formatPesos(paso) }))];

function RoundingPicker({ value, onChange }: { value: number; onChange: (paso: number) => void }) {
  return (
    <Field label="Redondear para arriba">
      <div className="flex flex-wrap gap-2">
        {REDONDEOS.map((r) => (
          <button
            key={r.paso}
            type="button"
            aria-pressed={value === r.paso}
            onClick={() => onChange(r.paso)}
            className={`min-h-11 rounded-full border px-4 text-sm ${value === r.paso ? "border-ink bg-ink text-paper" : "border-ink-soft"}`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

/** Ganancia general, aumento en lote y recalcular desde el costo. */
export function PreciosView({
  productos,
  categorias,
  margenGeneral,
  onSaved,
  onClose,
}: {
  productos: Producto[];
  categorias: string[];
  margenGeneral: number;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Ganancia general
  const [general, setGeneral] = useState(String(margenGeneral));
  const generalNum = leerPorcentaje(general);

  // Aumento en lote
  const [scope, setScope] = useState<string>("todas");
  const [pct, setPct] = useState("");
  const [baja, setBaja] = useState(false);
  const [paso, setPaso] = useState(100);
  const [pasoRecalc, setPasoRecalc] = useState(100);
  const [confirm, setConfirm] = useState<"lote" | "recalcular" | null>(null);

  const enUso = categorias.filter((c) => productos.some((p) => p.categoria === c));
  const elegidos = useMemo(
    () => (scope === "todas" ? productos : productos.filter((p) => p.categoria === scope)),
    [productos, scope],
  );
  const pctNum = leerPorcentaje(pct);
  const pctFirmado = pctNum == null ? null : baja ? -pctNum : pctNum;
  const loteValido = pctFirmado != null && pctFirmado !== 0 && pctFirmado > -90 && pctFirmado <= 500;
  const ejemplo = elegidos[0];

  const conCosto = productos.filter((p) => p.costo != null);

  const run = async (task: () => Promise<string>) => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const msg = await task();
      await onSaved();
      setDone(msg);
      setConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onClose} className={`${btn.link} self-start`}>
        ← Volver a la lista
      </button>
      <h2 className="font-display text-3xl">Precios</h2>
      <ErrorText>{error}</ErrorText>
      {done ? (
        <p role="status" className="rounded-2xl bg-mint-soft px-4 py-3 text-sm font-medium">
          {done}
        </p>
      ) : null}

      <Card className="flex flex-col gap-3">
        <h3 className="font-display text-2xl">Ganancia general</h3>
        <p className="-mt-1 text-sm text-ink-soft">
          Se suma al costo para sugerir el precio de los modelos nuevos (110% = costo × 2,1). Cada modelo puede tener la suya.
        </p>
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            value={general}
            onChange={(e) => setGeneral(e.target.value.replace(/[^\d.,]/g, ""))}
            aria-label="Ganancia general en %"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            disabled={busy || generalNum == null || generalNum === margenGeneral}
            onClick={() =>
              run(async () => {
                await guardarAjustes({ margen_general: generalNum! });
                return `Ganancia general: ${generalNum}%. Los precios cargados no cambian; para pasarlos al nuevo %, usá «Recalcular desde el costo».`;
              })
            }
            className={btn.primary}
          >
            Guardar
          </button>
        </div>
        {generalNum != null ? (
          <p className="text-xs text-ink-soft">Ej.: costo {formatPesos(20000)} → {formatPesos(precioSugerido(20000, generalNum) ?? 0)}</p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4">
        <h3 className="font-display text-2xl">Aumento en lote</h3>
        <Field label="¿A cuáles?">
          <div className="flex flex-wrap gap-2">
            {["todas", ...enUso].map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={scope === c}
                onClick={() => {
                  setScope(c);
                  setConfirm(null);
                }}
                className={`min-h-11 rounded-full border px-4 text-sm ${scope === c ? "border-ink bg-ink text-paper" : "border-ink-soft"}`}
              >
                {c === "todas" ? `Todos (${productos.length})` : c}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex items-end gap-2">
          <div className="flex rounded-2xl border border-ink-soft p-1">
            {[false, true].map((b) => (
              <button
                key={String(b)}
                type="button"
                aria-pressed={baja === b}
                onClick={() => setBaja(b)}
                className={`min-h-10 rounded-xl px-3 text-sm font-medium ${baja === b ? "bg-ink text-paper" : ""}`}
              >
                {b ? "Bajar" : "Subir"}
              </button>
            ))}
          </div>
          <label className="flex flex-1 items-center gap-2">
            <input
              inputMode="decimal"
              value={pct}
              onChange={(e) => {
                setPct(e.target.value.replace(/[^\d.,]/g, ""));
                setConfirm(null);
              }}
              placeholder="10"
              aria-label="Porcentaje"
              className={inputClass}
            />
            <span className="font-semibold">%</span>
          </label>
        </div>
        <RoundingPicker value={paso} onChange={setPaso} />
        {loteValido && ejemplo ? (
          <p className="text-sm text-ink-soft">
            Ej.: {ejemplo.nombre} {formatPesos(ejemplo.precio)} →{" "}
            <strong className="text-ink">{formatPesos(aplicarPorcentaje(ejemplo.precio, pctFirmado!, paso))}</strong>
            {ejemplo.precio_anterior ? " (el tachado se mueve igual)" : ""}
          </p>
        ) : null}
        {confirm === "lote" ? (
          <div role="alert" className="rounded-2xl bg-mint-soft p-4 text-center">
            <p className="font-medium">
              ¿{baja ? "Bajar" : "Subir"} {pctNum}% el precio de {elegidos.length} {elegidos.length === 1 ? "modelo" : "modelos"}?
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirm(null)} className={`${btn.secondary} flex-1`}>
                No
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const n = await ajustarPrecios(elegidos.map((p) => p.id), pctFirmado!, paso);
                    setPct("");
                    return `Listo: ${n} ${n === 1 ? "precio cambiado" : "precios cambiados"}.`;
                  })
                }
                className={`${btn.primary} flex-1`}
              >
                Sí, cambiar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={!loteValido || elegidos.length === 0}
            onClick={() => setConfirm("lote")}
            className={btn.primary}
          >
            Cambiar precios
          </button>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="font-display text-2xl">Recalcular desde el costo</h3>
        <p className="-mt-1 text-sm text-ink-soft">
          Pone a cada modelo con costo cargado su precio sugerido (costo + su %). Pisa los retoques a mano.
          {conCosto.length < productos.length
            ? ` ${productos.length - conCosto.length} sin costo cargado no se tocan.`
            : ""}
        </p>
        <RoundingPicker value={pasoRecalc} onChange={setPasoRecalc} />
        {confirm === "recalcular" ? (
          <div role="alert" className="rounded-2xl bg-mint-soft p-4 text-center">
            <p className="font-medium">¿Recalcular el precio de {conCosto.length} {conCosto.length === 1 ? "modelo" : "modelos"}?</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirm(null)} className={`${btn.secondary} flex-1`}>
                No
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const n = await recalcularPrecios(conCosto.map((p) => p.id), pasoRecalc);
                    return `Listo: ${n} ${n === 1 ? "precio recalculado" : "precios recalculados"}.`;
                  })
                }
                className={`${btn.primary} flex-1`}
              >
                Sí, recalcular
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={conCosto.length === 0}
            onClick={() => setConfirm("recalcular")}
            className={btn.secondary}
          >
            {conCosto.length ? `Recalcular ${conCosto.length}` : "Ningún modelo tiene costo cargado"}
          </button>
        )}
      </Card>
    </div>
  );
}
