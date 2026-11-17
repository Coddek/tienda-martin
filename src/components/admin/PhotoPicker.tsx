import { useEffect, useRef, useState } from "react";
import { preparePhoto, type CutoutResult } from "@/lib/cutout";

type Props = {
  /** Se llama cada vez que hay una versión lista (o null si se saca la foto). */
  onChange: (photo: CutoutResult | null) => void;
  /** Foto actual (al cambiar la de un color existente). */
  currentUrl?: string | null;
};

const DEFAULT_TOLERANCE = 34;

/**
 * Foto del zapato: se saca con el celular (o se elige de la galería), se le
 * recorta el fondo acá mismo y se ve cómo va a quedar sobre el verde de la
 * página. Si el recorte no sale bien, se ajusta la fuerza o se usa sin recortar.
 */
export function PhotoPicker({ onChange, currentUrl }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cut, setCut] = useState(true);
  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que cambia la foto o el ajuste, se vuelve a procesar.
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const next = await preparePhoto(file, { cut, tolerance });
        if (cancelled) return;
        const url = URL.createObjectURL(next.blob);
        setPreview((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return url;
        });
        onChange(next);
      } catch (e) {
        if (cancelled) return;
        setPreview((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return null;
        });
        onChange(null);
        setError(e instanceof Error ? e.message : "No se pudo procesar la foto.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [file, cut, tolerance, onChange]);

  const shown = preview ?? currentUrl ?? null;

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <div className="rounded-2xl bg-mint-soft px-4 py-3 text-sm leading-relaxed text-ink">
          <p className="font-semibold">Para que quede como las demás:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>Zapato de costado, sobre una cartulina o sábana blanca.</li>
            <li>Con buena luz y sin sombras fuertes.</li>
            <li>Que el zapato entre entero, con un poco de blanco alrededor.</li>
          </ul>
        </div>
      ) : null}

      <div className="product-tile relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por next/image
          <img src={shown} alt="Vista previa de la foto" className="h-full w-full object-contain p-5" />
        ) : (
          <span className="px-6 text-center text-sm text-ink-soft">Todavía no hay foto</span>
        )}
        {busy ? (
          <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-2 text-center text-sm text-paper">
            Recortando el fondo…
          </span>
        ) : null}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          if (next) {
            setFile(next);
            setCut(true);
            setTolerance(DEFAULT_TOLERANCE);
          }
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            input.current?.removeAttribute("capture");
            input.current?.setAttribute("capture", "environment");
            input.current?.click();
          }}
          className="min-h-12 flex-1 rounded-2xl bg-ink px-4 font-semibold text-paper"
        >
          {file || currentUrl ? "Sacar otra" : "Sacar foto"}
        </button>
        <button
          type="button"
          onClick={() => {
            // Sin "capture": deja elegir de la galería.
            input.current?.removeAttribute("capture");
            input.current?.click();
          }}
          className="min-h-12 flex-1 rounded-2xl border border-ink-soft px-4 font-medium text-ink"
        >
          Elegir de la galería
        </button>
      </div>

      {file ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-mint px-4 py-3">
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            Recortar el fondo
            <input
              type="checkbox"
              checked={cut}
              onChange={(e) => setCut(e.target.checked)}
              className="h-6 w-6 accent-ink"
            />
          </label>
          {cut ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="flex justify-between font-medium">
                Fuerza del recorte
                <span className="text-ink-soft">
                  {tolerance < 25 ? "suave" : tolerance > 50 ? "fuerte" : "normal"}
                </span>
              </span>
              <input
                type="range"
                min={10}
                max={80}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="accent-ink"
              />
              <span className="text-xs text-ink-soft">
                Si quedan restos del fondo, subila. Si se come partes del zapato, bajala.
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-rust">{error}</p> : null}
    </div>
  );
}
