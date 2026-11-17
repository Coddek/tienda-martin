import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import {
  asegurarTalle,
  crearColor,
  crearProducto,
  findCodigo,
  guardarCodigo,
  moverStock,
  slugify,
  subirFoto,
  type CodigoEncontrado,
  type Color,
  type Producto,
  type Talle,
} from "@/lib/admin-data";
import type { CutoutResult } from "@/lib/cutout";
import { photoPublicUrl } from "@/lib/supabase-browser";
import { PhotoPicker } from "./PhotoPicker";
import { Scanner } from "./Scanner";
import { btn, Card, ErrorText, Field, formatPesos, inputClass, SizeGrid, Stepper } from "./ui";

type Props = {
  productos: Producto[];
  categorias: string[];
  /** Después de guardar: recarga la lista y refresca la página pública. */
  onSaved: () => Promise<void>;
};

type Step =
  | { kind: "scan" }
  | { kind: "loading"; code: string }
  | { kind: "known"; code: string; found: CodigoEncontrado; talle: Talle | null }
  | { kind: "new"; code: string }
  | { kind: "newForModel"; code: string; producto: Producto }
  | { kind: "newModel"; code: string }
  | { kind: "done"; text: string };

/** "7900067313927" → "7 900067 313927", como viene impreso en la etiqueta. */
const formatBarcode = (code: string) =>
  code.length === 13 ? `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}` : code;

/** El último modelo y color cargados: la caja siguiente suele ser otro talle del mismo. */
type Last = { productoId: string; colorId: string } | null;

/**
 * Cargar mercadería: escanear la caja y sumar el par. Si el código es nuevo,
 * se elige de qué modelo y color es (o se crea el modelo con su foto) una sola
 * vez; desde ahí ese código se reconoce siempre.
 */
export function IngresoTab({ productos, categorias, onSaved }: Props) {
  const [step, setStep] = useState<Step>({ kind: "scan" });
  const [last, setLast] = useState<Last>(null);
  const [error, setError] = useState<string | null>(null);

  const onDetect = useCallback(async (code: string) => {
    setError(null);
    setStep({ kind: "loading", code });
    try {
      const found = await findCodigo(code);
      if (!found) {
        setStep({ kind: "new", code });
        return;
      }
      const talle = found.talle_id ? (found.color.talles.find((t) => t.id === found.talle_id) ?? null) : null;
      setStep({ kind: "known", code, found, talle });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo buscar el código.");
      setStep({ kind: "scan" });
    }
  }, []);

  const finish = async (text: string, productoId: string, colorId: string) => {
    setLast({ productoId, colorId });
    setStep({ kind: "done", text });
    await onSaved();
  };

  const again = () => {
    setError(null);
    setStep({ kind: "scan" });
  };

  return (
    <div className="flex flex-col gap-4">
      <ErrorText>{error}</ErrorText>

      {step.kind === "scan" ? (
        <>
          <h2 className="font-display text-3xl">Cargar mercadería</h2>
          <p className="-mt-2 text-sm text-ink-soft">Escaneá la caja: se suma el par al stock.</p>
          <Scanner onDetect={onDetect} />
        </>
      ) : null}

      {step.kind === "loading" ? <p className="py-10 text-center text-ink-soft">Buscando {step.code}…</p> : null}

      {step.kind === "known" ? (
        <KnownCode
          code={step.code}
          found={step.found}
          talle={step.talle}
          onCancel={again}
          onError={setError}
          onDone={finish}
        />
      ) : null}

      {step.kind === "new" ? (
        <NewCodeChoice
          code={step.code}
          productos={productos}
          last={last}
          onPickModel={(producto) => setStep({ kind: "newForModel", code: step.code, producto })}
          onNewModel={() => setStep({ kind: "newModel", code: step.code })}
          onCancel={again}
        />
      ) : null}

      {step.kind === "newForModel" ? (
        <NewCodeForModel
          code={step.code}
          producto={step.producto}
          preferredColorId={last?.productoId === step.producto.id ? last.colorId : null}
          onCancel={again}
          onError={setError}
          onDone={finish}
        />
      ) : null}

      {step.kind === "newModel" ? (
        <NewModel code={step.code} categorias={categorias} onCancel={again} onError={setError} onDone={finish} />
      ) : null}

      {step.kind === "done" ? (
        <Card className="flex flex-col items-center gap-4 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-2xl text-gold">
            ✓
          </span>
          <p className="text-lg font-semibold">{step.text}</p>
          <button type="button" onClick={again} className={`${btn.cta} w-full`}>
            Escanear otra caja
          </button>
        </Card>
      ) : null}
    </div>
  );
}

function ModelHeader({ producto, color }: { producto: Pick<Producto, "nombre" | "ref" | "precio">; color?: Color }) {
  return (
    <div className="flex items-center gap-4">
      {color?.foto_path ? (
        <span className="product-tile relative block h-20 w-24 shrink-0 overflow-hidden rounded-2xl">
          <Image src={photoPublicUrl(color.foto_path)} alt="" fill sizes="96px" className="object-contain p-2" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="font-display text-2xl leading-tight">{producto.nombre}</p>
        <p className="text-sm text-ink-soft">
          Ref. {producto.ref}
          {color ? ` · ${color.nombre}` : ""} · {formatPesos(producto.precio)}
        </p>
      </div>
    </div>
  );
}

type DoneFn = (text: string, productoId: string, colorId: string) => Promise<void>;

/** Código ya cargado: confirmar y sumar (si el código sirve para varios talles, se elige cuál). */
export function KnownCode({
  code,
  found,
  talle,
  onCancel,
  onError,
  onDone,
}: {
  code: string;
  found: CodigoEncontrado;
  talle: Talle | null;
  onCancel: () => void;
  onError: (msg: string | null) => void;
  onDone: DoneFn;
}) {
  const [size, setSize] = useState<number | null>(talle?.talle_ar ?? null);
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const { color } = found;
  const stockBySize = Object.fromEntries(color.talles.map((t) => [t.talle_ar, t.stock]));

  const save = async () => {
    if (size == null) return;
    setSaving(true);
    onError(null);
    try {
      const target = talle ?? (await asegurarTalle(color.id, size, size - 1));
      await moverStock(target.id, qty, "ingreso", { codigo: code });
      await onDone(
        `Listo: ${qty === 1 ? "se sumó 1 par" : `se sumaron ${qty} pares`} de ${color.producto.nombre} ${color.nombre}, talle ${size}.`,
        color.producto.id,
        color.id,
      );
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo sumar el par.");
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-5">
      <ModelHeader producto={color.producto} color={color} />
      {talle ? (
        <p className="rounded-2xl bg-mint-soft px-4 py-3 text-lg">
          Talle <strong>{talle.talle_ar}</strong> AR{talle.talle_br ? ` (${talle.talle_br} BR)` : ""} · hay{" "}
          <strong>{talle.stock}</strong>
        </p>
      ) : (
        <Field label="¿Qué talle es? (argentino, el de abajo en la etiqueta)">
          <SizeGrid value={size} onChange={setSize} stockBySize={stockBySize} />
        </Field>
      )}
      <Field label="¿Cuántas cajas iguales sumás?">
        <Stepper value={qty} onChange={setQty} label="pares" />
      </Field>
      <button type="button" disabled={saving || size == null} onClick={save} className={btn.cta}>
        {saving ? "Guardando…" : "Sumar al stock"}
      </button>
      <button type="button" onClick={onCancel} className={btn.link}>
        No es este, escanear de nuevo
      </button>
    </Card>
  );
}

/** Código que todavía no conoce: ¿de qué modelo es? */
export function NewCodeChoice({
  code,
  productos,
  last,
  onPickModel,
  onNewModel,
  onCancel,
}: {
  code: string;
  productos: Producto[];
  last: Last;
  onPickModel: (producto: Producto) => void;
  onNewModel: () => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const lastProducto = last ? productos.find((p) => p.id === last.productoId) : undefined;
  const lastColor = lastProducto?.colores.find((c) => c.id === last?.colorId);
  const matches = useMemo(() => {
    const q = slugify(query);
    if (!q) return productos.slice(0, 8);
    return productos.filter((p) => slugify(`${p.nombre} ${p.ref}`).includes(q)).slice(0, 12);
  }, [productos, query]);

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium tracking-[0.1em] text-ink-soft uppercase">Código nuevo</p>
        {/* Con los mismos espacios que la etiqueta, para comparar de un vistazo. */}
        <p className="mt-1 font-mono text-2xl tracking-[0.08em]">{formatBarcode(code)}</p>
        <p className="mt-2 rounded-2xl bg-mint-soft px-4 py-3 text-sm text-ink">
          <strong>Revisá que coincida con el número de la etiqueta.</strong> Si no coincide, tocá Cancelar y escaneá
          de nuevo (o tipealo). Es la primera vez que se escanea: decí de qué modelo es y queda guardado para siempre.
        </p>
      </div>

      {lastProducto && lastColor ? (
        <button
          type="button"
          onClick={() => onPickModel(lastProducto)}
          className="rounded-2xl border-2 border-ink px-4 py-3 text-left"
        >
          <span className="block text-sm text-ink-soft">¿Es otro talle o color del último?</span>
          <span className="block font-display text-xl">
            {lastProducto.nombre} · {lastColor.nombre}
          </span>
        </button>
      ) : null}

      <Field label="Buscar el modelo (nombre o referencia)">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej.: 6291.900 o Paris"
          className={inputClass}
        />
      </Field>
      {matches.length ? (
        <ul className="flex flex-col gap-2">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPickModel(p)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-mint px-4 py-3 text-left hover:border-ink"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.nombre}</span>
                  <span className="block text-sm text-ink-soft">
                    Ref. {p.ref} · {p.colores.map((c) => c.nombre).join(", ") || "sin colores"}
                  </span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">No hay modelos con ese nombre o referencia.</p>
      )}

      <button type="button" onClick={onNewModel} className={btn.primary}>
        Es un modelo nuevo
      </button>
      <button type="button" onClick={onCancel} className={btn.link}>
        Cancelar
      </button>
    </Card>
  );
}

/** Talle (y brasileño, que se completa solo) + cantidad: lo comparten los dos formularios de alta. */
function SizeAndQty({
  size,
  setSize,
  sizeBr,
  setSizeBr,
  qty,
  setQty,
  stockBySize,
}: {
  size: number | null;
  setSize: (n: number) => void;
  sizeBr: string;
  setSizeBr: (s: string) => void;
  qty: number;
  setQty: (n: number) => void;
  stockBySize?: Record<number, number>;
}) {
  return (
    <>
      <Field label="Talle argentino (el de abajo en la etiqueta: AR)">
        <SizeGrid
          value={size}
          onChange={(n) => {
            setSize(n);
            setSizeBr(String(n - 1));
          }}
          stockBySize={stockBySize}
        />
      </Field>
      <Field label="Talle brasileño (BR)" hint="Se completa solo (uno menos). Cambialo si la etiqueta dice otro.">
        <input
          inputMode="numeric"
          value={sizeBr}
          onChange={(e) => setSizeBr(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className={`${inputClass} max-w-28`}
        />
      </Field>
      <Field label="¿Cuántas cajas iguales sumás?">
        <Stepper value={qty} onChange={setQty} label="pares" />
      </Field>
    </>
  );
}

/** Código nuevo de un modelo que ya existe: elegir color (o crear uno con foto) y talle. */
export function NewCodeForModel({
  code,
  producto,
  preferredColorId,
  onCancel,
  onError,
  onDone,
}: {
  code: string;
  producto: Producto;
  preferredColorId: string | null;
  onCancel: () => void;
  onError: (msg: string | null) => void;
  onDone: DoneFn;
}) {
  const [colorId, setColorId] = useState<string | "nuevo">(
    preferredColorId ?? producto.colores[0]?.id ?? "nuevo",
  );
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [swatch, setSwatch] = useState("#1E1E1E");
  const [photo, setPhoto] = useState<CutoutResult | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [sizeBr, setSizeBr] = useState("");
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const color = producto.colores.find((c) => c.id === colorId);
  const onPhoto = useCallback((p: CutoutResult | null) => {
    setPhoto(p);
    if (p) setSwatch(p.swatch);
  }, []);

  const ready = size != null && (colorId !== "nuevo" || (colorName.trim() && photo));

  const save = async () => {
    if (!ready || size == null) return;
    setSaving(true);
    onError(null);
    try {
      let target: Color | undefined = color;
      if (colorId === "nuevo") {
        const foto = photo ? await subirFoto(producto.slug, colorName, photo) : undefined;
        target = await crearColor({
          producto_id: producto.id,
          nombre: colorName.trim(),
          muestra: swatch.toUpperCase(),
          codigo_color: colorCode.trim() || null,
          foto,
          orden: producto.colores.length,
        });
      }
      if (!target) throw new Error("Elegí el color.");
      const talle = await asegurarTalle(target.id, size, sizeBr ? Number(sizeBr) : null);
      await guardarCodigo(code, target.id, talle.id);
      await moverStock(talle.id, qty, "ingreso", { codigo: code });
      await onDone(
        `Listo: ${producto.nombre} ${target.nombre}, talle ${size}. ${qty === 1 ? "Se sumó 1 par" : `Se sumaron ${qty} pares`} y el código quedó guardado.`,
        producto.id,
        target.id,
      );
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo guardar.");
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-5">
      <ModelHeader producto={producto} color={color} />
      <Field label="Color">
        <div className="flex flex-wrap gap-2">
          {producto.colores.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={colorId === c.id}
              onClick={() => setColorId(c.id)}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-4 ${
                colorId === c.id ? "border-ink bg-ink text-paper" : "border-ink-soft"
              }`}
            >
              <span className="h-4 w-4 rounded-full border border-ink-soft" style={{ background: c.muestra }} />
              {c.nombre}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={colorId === "nuevo"}
            onClick={() => setColorId("nuevo")}
            className={`min-h-11 rounded-full border px-4 ${
              colorId === "nuevo" ? "border-ink bg-ink text-paper" : "border-dashed border-ink-soft"
            }`}
          >
            + Color nuevo
          </button>
        </div>
      </Field>

      {colorId === "nuevo" ? (
        <NewColorFields
          name={colorName}
          setName={setColorName}
          code={colorCode}
          setCode={setColorCode}
          swatch={swatch}
          setSwatch={setSwatch}
          onPhoto={onPhoto}
        />
      ) : null}

      <SizeAndQty
        size={size}
        setSize={setSize}
        sizeBr={sizeBr}
        setSizeBr={setSizeBr}
        qty={qty}
        setQty={setQty}
        stockBySize={color ? Object.fromEntries(color.talles.map((t) => [t.talle_ar, t.stock])) : undefined}
      />

      <button type="button" disabled={!ready || saving} onClick={save} className={btn.cta}>
        {saving ? "Guardando…" : "Guardar y sumar"}
      </button>
      <button type="button" onClick={onCancel} className={btn.link}>
        Cancelar
      </button>
    </Card>
  );
}

function NewColorFields({
  name,
  setName,
  code,
  setCode,
  swatch,
  setSwatch,
  onPhoto,
}: {
  name: string;
  setName: (s: string) => void;
  code: string;
  setCode: (s: string) => void;
  swatch: string;
  setSwatch: (s: string) => void;
  onPhoto: (p: CutoutResult | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-mint-soft/60 p-4">
      <Field label="Nombre del color" hint="Como figura en la etiqueta: por ejemplo «Negro 01».">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Negro 01" className={inputClass} />
      </Field>
      <Field label="Foto de este color">
        <PhotoPicker onChange={onPhoto} />
      </Field>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Código de color (opcional)" hint="El último número de la etiqueta, ej. 15745.">
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </Field>
        <Field label="Botón">
          <input
            type="color"
            value={swatch}
            onChange={(e) => setSwatch(e.target.value)}
            aria-label="Color del botón redondo en la página"
            className="h-12 w-16 cursor-pointer rounded-2xl border border-ink-soft bg-paper p-1"
          />
        </Field>
      </div>
    </div>
  );
}

/** Modelo nuevo completo: datos, color con foto, talle y cantidad. */
export function NewModel({
  code,
  categorias,
  onCancel,
  onError,
  onDone,
}: {
  code: string;
  categorias: string[];
  onCancel: () => void;
  onError: (msg: string | null) => void;
  onDone: DoneFn;
}) {
  const [nombre, setNombre] = useState("");
  const [ref, setRef] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? "");
  const [precio, setPrecio] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [swatch, setSwatch] = useState("#1E1E1E");
  const [photo, setPhoto] = useState<CutoutResult | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [sizeBr, setSizeBr] = useState("");
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const onPhoto = useCallback((p: CutoutResult | null) => {
    setPhoto(p);
    if (p) setSwatch(p.swatch);
  }, []);

  const price = Number(precio.replace(/\D/g, ""));
  const missing = [
    !nombre.trim() && "el nombre",
    !ref.trim() && "la referencia",
    !categoria.trim() && "la categoría",
    !(price > 0) && "el precio",
    !colorName.trim() && "el color",
    !photo && "la foto",
    size == null && "el talle",
  ].filter(Boolean) as string[];

  const save = async () => {
    if (missing.length || size == null || !photo) return;
    setSaving(true);
    onError(null);
    try {
      const producto = await crearProducto({
        nombre: nombre.trim(),
        ref: ref.trim(),
        categoria: categoria.trim(),
        precio: price,
      });
      const foto = await subirFoto(producto.slug, colorName, photo);
      const color = await crearColor({
        producto_id: producto.id,
        nombre: colorName.trim(),
        muestra: swatch.toUpperCase(),
        codigo_color: colorCode.trim() || null,
        foto,
      });
      const talle = await asegurarTalle(color.id, size, sizeBr ? Number(sizeBr) : null);
      await guardarCodigo(code, color.id, talle.id);
      await moverStock(talle.id, qty, "ingreso", { codigo: code });
      await onDone(
        `Listo: ${producto.nombre} ${color.nombre}, talle ${size}, ya está en la página.`,
        producto.id,
        color.id,
      );
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo crear el modelo.");
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-medium tracking-[0.1em] text-ink-soft uppercase">Modelo nuevo</p>
        <p className="mt-1 text-sm text-ink-soft">Código {formatBarcode(code)}</p>
      </div>
      <Field label="Nombre" hint="Cómo lo van a ver en la página. Ej.: Sandalia Paris.">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Referencia" hint="El primer número de la etiqueta, ej. 6291.900.">
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="6291.900" className={inputClass} />
      </Field>
      <Field label="Categoría">
        <input
          list="categorias"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className={inputClass}
        />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="Precio (en pesos)">
        <input
          inputMode="numeric"
          value={precio}
          onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ""))}
          placeholder="89900"
          className={inputClass}
        />
      </Field>

      <NewColorFields
        name={colorName}
        setName={setColorName}
        code={colorCode}
        setCode={setColorCode}
        swatch={swatch}
        setSwatch={setSwatch}
        onPhoto={onPhoto}
      />

      <SizeAndQty size={size} setSize={setSize} sizeBr={sizeBr} setSizeBr={setSizeBr} qty={qty} setQty={setQty} />

      {missing.length ? <p className="text-sm text-ink-soft">Falta {missing.join(", ")}.</p> : null}
      <button type="button" disabled={missing.length > 0 || saving} onClick={save} className={btn.cta}>
        {saving ? "Guardando…" : "Crear modelo y sumar"}
      </button>
      <button type="button" onClick={onCancel} className={btn.link}>
        Cancelar
      </button>
    </Card>
  );
}
