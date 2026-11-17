import { useEffect, useState } from "react";
import { loadMovimientos, type Movimiento } from "@/lib/admin-data";
import { btn, Card, ErrorText } from "./ui";

const MOTIVO: Record<Movimiento["motivo"], string> = {
  ingreso: "Ingreso",
  venta: "Venta",
  devolucion: "Devolución",
  ajuste: "Ajuste",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/**
 * Historial de entradas y salidas de pares. Las ventas "sin stock" (el sistema
 * tenía 0 y se vendió igual) quedan marcadas: conviene contar ese talle.
 */
export function MovimientosTab() {
  const [items, setItems] = useState<Movimiento[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadMovimientos()
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el historial.");
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const load = () => setVersion((v) => v + 1);

  const shown = items?.filter((m) => !onlyDiff || m.diferencia) ?? [];
  const diffCount = items?.filter((m) => m.diferencia).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-3xl">Historial</h2>
        <button type="button" onClick={load} className={btn.link}>
          Actualizar
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
      {diffCount ? (
        <button
          type="button"
          aria-pressed={onlyDiff}
          onClick={() => setOnlyDiff(!onlyDiff)}
          className={`rounded-2xl px-4 py-3 text-left text-sm font-medium ${
            onlyDiff ? "bg-rust text-paper" : "bg-rust/10 text-rust"
          }`}
        >
          {diffCount === 1 ? "1 venta" : `${diffCount} ventas`} de pares que figuraban sin stock: conviene contar
          esos talles. {onlyDiff ? "Ver todo" : "Ver solo esas"}
        </button>
      ) : null}
      {items === null && !error ? <p className="text-ink-soft">Cargando…</p> : null}
      {items && shown.length === 0 ? (
        <Card>
          <p className="text-ink-soft">Todavía no hay movimientos.</p>
        </Card>
      ) : null}
      <ul className="flex flex-col divide-y divide-mint rounded-3xl border border-mint bg-paper px-4">
        {shown.map((m) => (
          <li key={m.id} className="flex items-start justify-between gap-3 py-3">
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {m.talle ? `${m.talle.color.producto.nombre} · ${m.talle.color.nombre} · T${m.talle.talle_ar}` : "Talle borrado"}
              </span>
              <span className="block text-xs text-ink-soft">
                {when(m.created_at)} · {MOTIVO[m.motivo]}
                {m.nota ? ` · ${m.nota}` : ""}
              </span>
              {m.diferencia ? (
                <span className="mt-1 inline-block rounded-full bg-rust px-2 text-xs font-semibold text-paper">
                  Figuraba sin stock
                </span>
              ) : null}
            </span>
            <span className={`shrink-0 text-lg font-semibold ${m.cantidad > 0 ? "text-ink" : "text-rust"}`}>
              {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
