import { useState } from "react";
import { siteConfig } from "../../../site.config";
import { actualizarProducto, guardarAjustes, ordenar, type Ajustes, type Producto } from "@/lib/admin-data";
import { byOrden, moved, OrderRow } from "./ProductosTools";
import { btn, Card, ErrorText, Field, inputClass } from "./ui";

type Props = {
  ajustes: Ajustes;
  productos: Producto[];
  onSaved: () => Promise<void>;
};

const ANUNCIO_MAX = 120;

/** "@zapateria.martin" o "instagram.com/zapateria.martin/" → "zapateria.martin". */
const limpiarInstagram = (v: string) =>
  v
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "");

/**
 * Lo que ellas pueden cambiar de la página sin tocar el diseño: el cartel de
 * arriba, qué modelos van en la portada y en qué orden, y los datos del local.
 */
export function PaginaTab({ ajustes, productos, onSaved }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-3xl">Página</h2>
      <Anuncio ajustes={ajustes} onSaved={onSaved} />
      {/* Se rearma cuando cambian los destacados guardados (al sumar o sacar uno). */}
      <Destacados key={featuredKey(productos)} productos={productos} onSaved={onSaved} />
      <DatosLocal ajustes={ajustes} onSaved={onSaved} />
    </div>
  );
}

const featuredKey = (productos: Producto[]) =>
  productos
    .filter((p) => p.destacado)
    .sort(byOrden)
    .map((p) => p.id)
    .join();

/** Guardar con mensaje de "Guardado ✓" y error a la vista. */
function useSave(onSaved: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      await onSaved();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, saved, error, run };
}

function Anuncio({ ajustes, onSaved }: { ajustes: Ajustes; onSaved: () => Promise<void> }) {
  const [texto, setTexto] = useState(ajustes.anuncio_texto ?? "");
  const [activo, setActivo] = useState(ajustes.anuncio_activo);
  const { busy, saved, error, run } = useSave(onSaved);
  const changed = texto.trim() !== (ajustes.anuncio_texto ?? "") || activo !== ajustes.anuncio_activo;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-2xl">Cartel de arriba</h3>
        <p className="text-sm text-ink-soft">Una franja arriba de todo. Ej.: «20% off en efectivo» o «Llegó la temporada».</p>
      </div>
      <ErrorText>{error}</ErrorText>
      <Field label="Texto" hint={`${texto.trim().length}/${ANUNCIO_MAX}`}>
        <input
          value={texto}
          maxLength={ANUNCIO_MAX}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="20% off pagando en efectivo"
          className={inputClass}
        />
      </Field>
      <label className="flex items-center justify-between gap-4">
        <span className="font-semibold">Mostrar el cartel</span>
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-7 w-7 shrink-0 accent-ink"
        />
      </label>
      {texto.trim() ? (
        <div aria-hidden="true">
          <p className="mb-1 text-xs text-ink-soft">Así se ve{activo ? "" : " (ahora apagado)"}:</p>
          <p
            className={`rounded-xl bg-gold px-4 py-2 text-center text-xs font-semibold tracking-[0.08em] text-ink uppercase ${activo ? "" : "opacity-40"}`}
          >
            {texto.trim()}
          </p>
        </div>
      ) : null}
      <button
        type="button"
        disabled={busy || !changed || (activo && !texto.trim())}
        onClick={() => run(() => guardarAjustes({ anuncio_texto: texto.trim() || null, anuncio_activo: activo }))}
        className={btn.primary}
      >
        {busy ? "Guardando…" : saved ? "Guardado ✓" : "Guardar cartel"}
      </button>
      {activo && !texto.trim() ? <p className="-mt-2 text-xs text-rust">Escribí el texto para poder mostrarlo.</p> : null}
    </Card>
  );
}

function Destacados({ productos, onSaved }: { productos: Producto[]; onSaved: () => Promise<void> }) {
  const all = [...productos].sort(byOrden);
  const [list, setList] = useState(() => all.filter((p) => p.destacado));
  const [adding, setAdding] = useState("");
  const { busy, saved, error, run } = useSave(onSaved);
  const original = all.filter((p) => p.destacado).map((p) => p.id);
  const orderChanged = list.map((p) => p.id).join() !== original.join();
  const candidatos = all.filter((p) => !p.destacado && p.activo);

  /** Los destacados ocupan los mismos lugares del catálogo, en el orden nuevo. */
  const saveOrder = () =>
    run(async () => {
      const queue = [...list];
      const ids = all.map((p) => (p.destacado ? queue.shift()!.id : p.id));
      await ordenar(ids);
    });

  const setDestacado = (p: Producto, destacado: boolean) =>
    run(async () => {
      await actualizarProducto(p.id, { destacado });
    });

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-2xl">Destacados de la portada</h3>
        <p className="text-sm text-ink-soft">
          Los que pasan en «Lo más elegido», en este orden. Conviene entre 4 y 8.
          {list.length === 0 ? " Si no hay ninguno, salen los primeros del catálogo." : ""}
        </p>
      </div>
      <ErrorText>{error}</ErrorText>
      {list.length ? (
        <ol className="flex flex-col gap-2">
          {list.map((p, i) => (
            <OrderRow
              key={p.id}
              producto={p}
              index={i}
              total={list.length}
              onMove={(a, b) => setList(moved(list, a, b))}
              action={
                <button
                  type="button"
                  disabled={busy || orderChanged}
                  aria-label={`Sacar ${p.nombre} de destacados`}
                  onClick={() => setDestacado(p, false)}
                  className="h-11 w-10 shrink-0 rounded-2xl border border-rust/40 text-lg text-rust disabled:opacity-30"
                >
                  ✕
                </button>
              }
            />
          ))}
        </ol>
      ) : null}
      {orderChanged ? (
        <button type="button" disabled={busy} onClick={saveOrder} className={btn.primary}>
          {busy ? "Guardando…" : "Guardar orden"}
        </button>
      ) : saved ? (
        <p role="status" className="text-sm font-medium">
          Guardado ✓
        </p>
      ) : null}
      {candidatos.length && !orderChanged ? (
        <div className="flex gap-2">
          <select
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            aria-label="Modelo para destacar"
            className={`${inputClass} min-w-0 flex-1`}
          >
            <option value="">Sumar un modelo…</option>
            {candidatos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.ref})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!adding || busy}
            onClick={() => {
              const p = candidatos.find((x) => x.id === adding);
              if (p) setDestacado(p, true);
            }}
            className={btn.primary}
          >
            Sumar
          </button>
        </div>
      ) : null}
    </Card>
  );
}

function DatosLocal({ ajustes, onSaved }: { ajustes: Ajustes; onSaved: () => Promise<void> }) {
  const base = siteConfig.contact;
  const [whatsapp, setWhatsapp] = useState(ajustes.whatsapp ?? "");
  const [instagram, setInstagram] = useState(ajustes.instagram ?? "");
  const [direccion, setDireccion] = useState(ajustes.direccion ?? "");
  const [horario, setHorario] = useState(ajustes.horario ?? "");
  const [mediosPago, setMediosPago] = useState(ajustes.medios_pago ?? "");
  const { busy, saved, error, run } = useSave(onSaved);

  const wa = whatsapp.replace(/\D/g, "");
  const ig = limpiarInstagram(instagram);
  const waError = wa && (wa.length < 10 || wa.length > 15) ? "Revisá el número: con 54 9 y la característica, sin el 15." : null;
  const igError = ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig) ? "Solo el usuario, sin espacios." : null;

  const save = () =>
    run(() =>
      guardarAjustes({
        whatsapp: wa || null,
        instagram: ig || null,
        direccion: direccion.trim() || null,
        horario: horario.trim() || null,
        medios_pago: mediosPago.trim() || null,
      }),
    );

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-2xl">Datos del local</h3>
        <p className="text-sm text-ink-soft">Lo que se deja vacío sigue mostrando lo que ya tenía la página.</p>
      </div>
      <ErrorText>{error}</ErrorText>
      <Field label="WhatsApp" hint={waError ?? "Ej.: 54 9 11 1234 5678. A este número llegan las consultas."}>
        <input
          inputMode="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder={base.whatsapp || "54 9 11 1234 5678"}
          className={inputClass}
        />
      </Field>
      <Field label="Instagram" hint={igError ?? "El usuario, sin @."}>
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder={base.instagram} className={inputClass} />
      </Field>
      <Field label="Dirección" hint="Se usa también para el mapa.">
        <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder={base.address} className={inputClass} />
      </Field>
      <Field label="Horario">
        <input value={horario} onChange={(e) => setHorario(e.target.value)} placeholder={base.hours} className={inputClass} />
      </Field>
      <Field label="Medios de pago" hint="Una línea debajo del catálogo y en cada producto.">
        <input
          value={mediosPago}
          maxLength={200}
          onChange={(e) => setMediosPago(e.target.value)}
          placeholder="Efectivo, débito, crédito y transferencia"
          className={inputClass}
        />
      </Field>
      <button type="button" disabled={busy || !!waError || !!igError} onClick={save} className={btn.primary}>
        {busy ? "Guardando…" : saved ? "Guardado ✓" : "Guardar datos"}
      </button>
    </Card>
  );
}
