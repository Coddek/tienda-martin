import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import {
  actualizarColor,
  actualizarProducto,
  asegurarTalle,
  borrarColor,
  borrarProducto,
  crearColor,
  moverStock,
  slugify,
  subirFoto,
  totalStock,
  type Color,
  type Etiqueta,
  type Producto,
} from "@/lib/admin-data";
import type { CutoutResult } from "@/lib/cutout";
import { photoPublicUrl } from "@/lib/supabase-browser";
import { PhotoPicker } from "./PhotoPicker";
import { btn, Card, ErrorText, Field, formatPesos, inputClass, SizeGrid } from "./ui";

type Props = {
  productos: Producto[];
  categorias: string[];
  onSaved: () => Promise<void>;
};

/** Lista de modelos con buscador; al tocar uno se edita. */
export function ProductosTab({ productos, categorias, onSaved }: Props) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const open = productos.find((p) => p.id === openId);

  const list = useMemo(() => {
    const q = slugify(query);
    return q ? productos.filter((p) => slugify(`${p.nombre} ${p.ref} ${p.categoria}`).includes(q)) : productos;
  }, [productos, query]);

  if (open) {
    return (
      <ProductEditor
        key={open.id}
        producto={open}
        categorias={categorias}
        onSaved={onSaved}
        onClose={() => setOpenId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-3xl">Productos</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre, referencia o categoría"
        className={inputClass}
      />
      {productos.length === 0 ? (
        <Card>
          <p className="text-ink-soft">
            Todavía no hay modelos cargados. Se crean desde <strong>Cargar</strong>, escaneando la primera caja de cada uno.
          </p>
        </Card>
      ) : null}
      <ul className="flex flex-col gap-2">
        {list.map((p) => {
          const photo = p.colores.find((c) => c.foto_path)?.foto_path;
          const stock = totalStock(p);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpenId(p.id)}
                className="flex w-full items-center gap-3 rounded-3xl border border-mint bg-paper p-3 text-left hover:border-ink"
              >
                <span className="product-tile relative block h-16 w-20 shrink-0 overflow-hidden rounded-2xl">
                  {photo ? (
                    <Image src={photoPublicUrl(photo)} alt="" fill sizes="80px" className="object-contain p-1.5" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xl leading-tight">{p.nombre}</span>
                  <span className="block text-sm text-ink-soft">
                    Ref. {p.ref} · {formatPesos(p.precio)}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className={stock > 0 ? "text-ink" : "text-rust"}>
                      {stock > 0 ? `${stock} ${stock === 1 ? "par" : "pares"}` : "Sin stock"}
                    </span>
                    {!p.activo ? <span className="rounded-full bg-ink-soft px-2 text-paper">Oculto</span> : null}
                    {p.destacado ? <span className="rounded-full bg-gold px-2 text-ink">Destacado</span> : null}
                  </span>
                </span>
                <span aria-hidden="true" className="text-xl text-ink-soft">
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ETIQUETAS: { value: Etiqueta | ""; label: string }[] = [
  { value: "", label: "Ninguna" },
  { value: "nuevo", label: "Nuevo" },
  { value: "ultimos", label: "Últimos pares" },
  { value: "oferta", label: "Oferta" },
];

function ProductEditor({
  producto,
  categorias,
  onSaved,
  onClose,
}: {
  producto: Producto;
  categorias: string[];
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(producto.nombre);
  const [ref, setRef] = useState(producto.ref);
  const [categoria, setCategoria] = useState(producto.categoria);
  const [precio, setPrecio] = useState(String(producto.precio));
  const [anterior, setAnterior] = useState(producto.precio_anterior ? String(producto.precio_anterior) : "");
  const [etiqueta, setEtiqueta] = useState<Etiqueta | "">(producto.etiqueta ?? "");
  const [destacado, setDestacado] = useState(producto.destacado);
  const [activo, setActivo] = useState(producto.activo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingColor, setAddingColor] = useState(false);

  const price = Number(precio);
  const before = anterior ? Number(anterior) : null;
  const priceError =
    !(price > 0) ? "Poné un precio." : before != null && before <= price ? "El precio anterior tiene que ser mayor." : null;

  const save = async () => {
    if (priceError) return;
    setSaving(true);
    setError(null);
    try {
      await actualizarProducto(producto.id, {
        nombre: nombre.trim(),
        ref: ref.trim(),
        categoria: categoria.trim(),
        precio: price,
        precio_anterior: before,
        etiqueta: etiqueta || null,
        destacado,
        activo,
      });
      await onSaved();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);
    try {
      await borrarProducto(producto.id);
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar.");
      setSaving(false);
    }
  };

  const hasPhoto = producto.colores.some((c) => c.foto_path);

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onClose} className={`${btn.link} self-start`}>
        ← Volver a la lista
      </button>
      <h2 className="font-display text-3xl leading-tight">{producto.nombre}</h2>
      {activo && hasPhoto ? (
        <a href={`/producto/${producto.slug}`} target="_blank" rel="noopener noreferrer" className={`${btn.link} -mt-3`}>
          Ver en la página ↗
        </a>
      ) : null}
      <ErrorText>{error}</ErrorText>

      <Card className="flex flex-col gap-4">
        <Field label="Nombre">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Referencia">
            <input value={ref} onChange={(e) => setRef(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Categoría">
            <input list="categorias-editor" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass} />
            <datalist id="categorias-editor">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio">
            <input
              inputMode="numeric"
              value={precio}
              onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
            />
          </Field>
          <Field label="Precio anterior" hint="Solo en ofertas: se ve tachado.">
            <input
              inputMode="numeric"
              value={anterior}
              onChange={(e) => setAnterior(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Etiqueta en la foto">
          <div className="flex flex-wrap gap-2">
            {ETIQUETAS.map((e) => (
              <button
                key={e.value}
                type="button"
                aria-pressed={etiqueta === e.value}
                onClick={() => setEtiqueta(e.value)}
                className={`min-h-11 rounded-full border px-4 text-sm ${
                  etiqueta === e.value ? "border-ink bg-ink text-paper" : "border-ink-soft"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </Field>
        <Toggle label="Se ve en la página" hint="Apagalo para ocultar el modelo sin borrarlo." checked={activo} onChange={setActivo} />
        <Toggle label="Destacado en la portada" hint="Aparece en «Lo más elegido»." checked={destacado} onChange={setDestacado} />
        {priceError ? <p className="text-sm font-medium text-rust">{priceError}</p> : null}
        <button type="button" disabled={saving || !!priceError} onClick={save} className={btn.cta}>
          {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar cambios"}
        </button>
      </Card>

      <h3 className="mt-2 font-display text-2xl">Colores y stock</h3>
      {producto.colores.map((color) => (
        <ColorEditor key={color.id} producto={producto} color={color} onSaved={onSaved} onError={setError} />
      ))}
      {addingColor ? (
        <NewColorCard producto={producto} onSaved={onSaved} onError={setError} onDone={() => setAddingColor(false)} />
      ) : (
        <button type="button" onClick={() => setAddingColor(true)} className={btn.secondary}>
          + Agregar un color
        </button>
      )}

      <div className="mt-6 border-t border-mint pt-5">
        {confirmDelete ? (
          <div role="alert" className="rounded-3xl bg-mint-soft p-4 text-center">
            <p className="font-medium">¿Borrar {producto.nombre} con sus colores, fotos y stock?</p>
            <p className="mt-1 text-sm text-ink-soft">No se puede deshacer. Para sacarlo de la página sin perderlo, ocultalo.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className={`${btn.secondary} flex-1`}>
                No, dejarlo
              </button>
              <button type="button" disabled={saving} onClick={remove} className={`${btn.primary} flex-1 bg-rust`}>
                Sí, borrar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className={`${btn.link} text-rust`}>
            Borrar este modelo
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        <span className="block font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-7 w-7 shrink-0 accent-ink" />
    </label>
  );
}

/** Un color: foto, nombre y stock por talle (con ajuste de a uno). */
function ColorEditor({
  producto,
  color,
  onSaved,
  onError,
}: {
  producto: Producto;
  color: Color;
  onSaved: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [changingPhoto, setChangingPhoto] = useState(false);
  const [photo, setPhoto] = useState<CutoutResult | null>(null);
  const [name, setName] = useState(color.nombre);
  const [busy, setBusy] = useState(false);
  const [addingSize, setAddingSize] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const onPhoto = useCallback((p: CutoutResult | null) => setPhoto(p), []);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    onError(null);
    try {
      await task();
      await onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="product-tile relative block h-20 w-24 shrink-0 overflow-hidden rounded-2xl">
          {color.foto_path ? (
            <Image src={photoPublicUrl(color.foto_path)} alt="" fill sizes="96px" className="object-contain p-2" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name.trim() !== color.nombre) run(() => actualizarColor(color.id, { nombre: name.trim() }));
            }}
            aria-label="Nombre del color"
            className={`${inputClass} font-medium`}
          />
          {!color.foto_path ? (
            <p className="mt-1 text-xs font-semibold text-rust">Sin foto: este color no se ve en la página.</p>
          ) : null}
        </div>
      </div>

      {changingPhoto ? (
        <div className="flex flex-col gap-3">
          <PhotoPicker onChange={onPhoto} currentUrl={color.foto_path ? photoPublicUrl(color.foto_path) : null} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setChangingPhoto(false)} className={`${btn.secondary} flex-1`}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={!photo || busy}
              onClick={() =>
                run(async () => {
                  if (!photo) return;
                  const foto = await subirFoto(producto.slug, color.nombre, photo);
                  await actualizarColor(color.id, { foto, muestra: photo.swatch });
                  setChangingPhoto(false);
                })
              }
              className={`${btn.primary} flex-1`}
            >
              Usar esta foto
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setChangingPhoto(true)} className={btn.secondary}>
          {color.foto_path ? "Cambiar la foto" : "Agregar la foto"}
        </button>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">Stock por talle</p>
        {color.talles.length === 0 ? <p className="text-sm text-ink-soft">Todavía no hay talles.</p> : null}
        <ul className="flex flex-col divide-y divide-mint">
          {color.talles.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">Talle {t.talle_ar}</span>
                {t.talle_br ? <span className="text-sm text-ink-soft"> ({t.talle_br} BR)</span> : null}
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy || t.stock <= 0}
                  aria-label={`Restar un par del talle ${t.talle_ar}`}
                  onClick={() => run(() => moverStock(t.id, -1, "ajuste", { nota: "Ajuste manual" }))}
                  className="h-11 w-11 rounded-2xl border border-ink-soft text-xl disabled:opacity-40"
                >
                  −
                </button>
                <span className={`min-w-8 text-center text-lg font-semibold ${t.stock === 0 ? "text-rust" : ""}`}>
                  {t.stock}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Sumar un par al talle ${t.talle_ar}`}
                  onClick={() => run(() => moverStock(t.id, 1, "ajuste", { nota: "Ajuste manual" }))}
                  className="h-11 w-11 rounded-2xl border border-ink-soft text-xl disabled:opacity-40"
                >
                  +
                </button>
              </span>
            </li>
          ))}
        </ul>
        {addingSize ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-ink-soft">Elegí el talle (argentino). Arranca en 0: sumale los pares.</p>
            <SizeGrid
              value={null}
              onChange={(size) =>
                run(async () => {
                  await asegurarTalle(color.id, size, size - 1);
                  setAddingSize(false);
                })
              }
            />
          </div>
        ) : (
          <button type="button" onClick={() => setAddingSize(true)} className={`${btn.link} mt-2`}>
            + Agregar un talle
          </button>
        )}
      </div>

      {confirmDelete ? (
        <div role="alert" className="rounded-2xl bg-mint-soft p-3 text-center text-sm">
          <p className="font-medium">¿Borrar el color {color.nombre} con su stock?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className={`${btn.secondary} min-h-11 flex-1`}>
              No
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => borrarColor(color.id))}
              className={`${btn.primary} min-h-11 flex-1 bg-rust`}
            >
              Sí, borrar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmDelete(true)} className={`${btn.link} self-start text-rust`}>
          Borrar este color
        </button>
      )}
    </Card>
  );
}

function NewColorCard({
  producto,
  onSaved,
  onError,
  onDone,
}: {
  producto: Producto;
  onSaved: () => Promise<void>;
  onError: (msg: string | null) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<CutoutResult | null>(null);
  const [busy, setBusy] = useState(false);
  const onPhoto = useCallback((p: CutoutResult | null) => setPhoto(p), []);

  const save = async () => {
    if (!name.trim() || !photo) return;
    setBusy(true);
    onError(null);
    try {
      const foto = await subirFoto(producto.slug, name, photo);
      await crearColor({
        producto_id: producto.id,
        nombre: name.trim(),
        muestra: photo.swatch,
        codigo_color: null,
        foto,
        orden: producto.colores.length,
      });
      await onSaved();
      onDone();
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo crear el color.");
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <Field label="Nombre del color">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chocolate" className={inputClass} />
      </Field>
      <PhotoPicker onChange={onPhoto} />
      <p className="text-xs text-ink-soft">
        Los talles y sus códigos se suman después, escaneando las cajas desde <strong>Cargar</strong>.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className={`${btn.secondary} flex-1`}>
          Cancelar
        </button>
        <button type="button" disabled={!name.trim() || !photo || busy} onClick={save} className={`${btn.primary} flex-1`}>
          {busy ? "Guardando…" : "Crear color"}
        </button>
      </div>
    </Card>
  );
}
