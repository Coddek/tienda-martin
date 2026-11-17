import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { cleanBarcode, isValidBarcode } from "@/lib/ean";

type Detector = { detect: (source: HTMLCanvasElement) => Promise<{ rawValue: string }[]> };

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/** Recuadro guía, en fracciones del visor (casi cuadrado: el código de estas cajas va parado). */
const GUIDE = { left: 0.12, right: 0.88, top: 0.08, bottom: 0.92 };
/** Lado mayor de cada cuadro que se analiza: más chico = más rápido en el celular. */
const MAX_SIDE = 1600;
/** Ventana para que el mismo número salga dos veces antes de aceptarlo. */
const CONFIRM_WINDOW_MS = 2500;
/** Después de esto sin leer, se muestran consejos. */
const HINT_AFTER_MS = 8000;

/**
 * Lector nativo del navegador si existe (Chrome en Android); si no (iPhone),
 * el de respaldo. Su motor (zxing_reader.wasm, ~1 MB) se sirve desde la propia
 * página (public/) y se descarga recién al abrir el escáner. Si se actualiza
 * la dependencia barcode-detector, copiar de nuevo node_modules/zxing-wasm/dist/reader/zxing_reader.wasm.
 */
async function createDetector(): Promise<Detector> {
  const native = (globalThis as { BarcodeDetector?: { new (o: object): Detector; getSupportedFormats(): Promise<string[]> } })
    .BarcodeDetector;
  if (native) {
    try {
      const supported = await native.getSupportedFormats();
      if (supported.includes("ean_13")) return new native({ formats: FORMATS });
    } catch {
      // sigue con el de respaldo
    }
  }
  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  await prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? "/zxing_reader.wasm" : prefix + path),
    },
    fireImmediately: true,
  });
  return new BarcodeDetector({ formats: FORMATS as never });
}

type Props = {
  onDetect: (code: string) => void;
  onCancel?: () => void;
};

/**
 * Cámara trasera + lectura del código de barras de la caja. Se analiza lo que
 * está dentro del recuadro (ampliado) y, alternando, todo el visor. Se acepta
 * un número cuando sale dos veces igual y cierra el dígito de control; después igual se confirma
 * el modelo en pantalla. Siempre se puede tipear el número de la etiqueta.
 */
export function Scanner({ onDetect, onCancel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "slow" | "error">("starting");
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let hintTimer = 0;
    let cancelled = false;
    const seen = new Map<string, number[]>();

    const finish = (code: string) => {
      if (done.current) return;
      done.current = true;
      navigator.vibrate?.(60);
      onDetect(code);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Este navegador no deja usar la cámara. Tipeá el número de la etiqueta.");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        let detector: Detector;
        try {
          detector = await createDetector();
        } catch {
          throw new Error("No se pudo cargar el lector. Revisá la conexión o tipeá el número de la etiqueta.");
        }
        if (cancelled) return;
        setStatus("scanning");
        hintTimer = window.setTimeout(() => {
          if (!done.current) setStatus("slow");
        }, HINT_AFTER_MS);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        let frame = 0;
        const tick = async () => {
          if (cancelled || done.current || !video.current || !ctx) return;
          const v = video.current;
          try {
            if (v.readyState >= 2 && v.videoWidth) {
              // Qué parte del video se ve en el visor (object-cover recorta los bordes).
              const box = v.getBoundingClientRect();
              const scale = Math.max(box.width / v.videoWidth, box.height / v.videoHeight);
              const visW = box.width / scale;
              const visH = box.height / scale;
              const visX = (v.videoWidth - visW) / 2;
              const visY = (v.videoHeight - visH) / 2;
              // Un cuadro el recuadro guía, el siguiente todo lo visible.
              const region =
                frame++ % 2 === 0
                  ? {
                      x: visX + visW * GUIDE.left,
                      y: visY + visH * GUIDE.top,
                      w: visW * (GUIDE.right - GUIDE.left),
                      h: visH * (GUIDE.bottom - GUIDE.top),
                    }
                  : { x: visX, y: visY, w: visW, h: visH };
              const k = Math.min(2, MAX_SIDE / Math.max(region.w, region.h));
              canvas.width = Math.round(region.w * k);
              canvas.height = Math.round(region.h * k);
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(v, region.x, region.y, region.w, region.h, 0, 0, canvas.width, canvas.height);
              const found = await detector.detect(canvas);
              const code = found.map((f) => cleanBarcode(f.rawValue)).find(isValidBarcode);
              if (code) {
                // Se acepta recién cuando el mismo número sale dos veces en 2,5 s
                // (con cuadros sin lectura en el medio, no importa). Probado con
                // las etiquetas: una lectura suelta puede ser un número equivocado
                // que igual cierra el dígito de control.
                const now = performance.now();
                const times = (seen.get(code) ?? []).filter((t) => now - t < CONFIRM_WINDOW_MS);
                times.push(now);
                seen.set(code, times);
                if (times.length >= 2) finish(code);
              }
            }
          } catch {
            // un cuadro que no se pudo leer: se prueba con el siguiente
          }
          timer = window.setTimeout(tick, 60);
        };
        tick();
      } catch (e) {
        if (cancelled) return;
        const denied = e instanceof DOMException && e.name === "NotAllowedError";
        setError(
          denied
            ? "No hay permiso para usar la cámara. Activalo en el navegador o tipeá el número de la etiqueta."
            : e instanceof Error
              ? e.message
              : "No se pudo abrir la cámara.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(hintTimer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetect]);

  const submitTyped = (event: SubmitEvent) => {
    event.preventDefault();
    const code = cleanBarcode(typed);
    if (!isValidBarcode(code)) {
      setTypedError("Ese número no es válido. Revisalo en la etiqueta (son 13 dígitos).");
      return;
    }
    done.current = true;
    onDetect(code);
  };

  const message =
    status === "starting"
      ? "Abriendo la cámara y el lector…"
      : status === "scanning"
        ? "Poné el código de barras adentro del recuadro, a unos 15 cm."
        : status === "slow"
          ? "Todavía no lee: acercá o alejá el celular hasta que el código se vea nítido y grande en el recuadro, con buena luz y sin reflejo. O tipeá los números abajo."
          : error;

  return (
    <div className="flex flex-col gap-4">
      {/* Vertical, como la cámara del celular en la mano: no se recorta casi nada de la imagen. */}
      <div className="relative mx-auto aspect-[3/4] max-h-[58svh] w-full overflow-hidden rounded-3xl bg-ink">
        <video ref={video} playsInline muted className="h-full w-full object-cover" />
        {status === "scanning" || status === "slow" ? (
          <div
            className="pointer-events-none absolute rounded-2xl border-2 border-gold shadow-[0_0_0_9999px_rgba(18,50,35,0.35)]"
            style={{
              left: `${GUIDE.left * 100}%`,
              right: `${(1 - GUIDE.right) * 100}%`,
              top: `${GUIDE.top * 100}%`,
              bottom: `${(1 - GUIDE.bottom) * 100}%`,
            }}
          />
        ) : null}
      </div>
      {/* Debajo del visor, no encima: así no tapa la etiqueta. */}
      <p
        aria-live="polite"
        className={`-mt-1 text-center text-sm ${status === "slow" || status === "error" ? "font-medium text-rust" : "text-ink-soft"}`}
      >
        {message}
      </p>

      <form onSubmit={submitTyped} className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink-soft" htmlFor="codigo-manual">
          ¿No lee? Tipeá los números de la etiqueta
        </label>
        <div className="flex gap-2">
          <input
            id="codigo-manual"
            inputMode="numeric"
            autoComplete="off"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setTypedError(null);
            }}
            placeholder="7 900067 313927"
            className="min-h-12 min-w-0 flex-1 rounded-2xl border border-ink-soft bg-paper px-4 text-lg tracking-[0.08em]"
          />
          <button type="submit" className="min-h-12 rounded-2xl bg-ink px-5 font-semibold text-paper">
            Usar
          </button>
        </div>
        {typedError ? <p className="text-sm font-medium text-rust">{typedError}</p> : null}
      </form>

      {onCancel ? (
        <button type="button" onClick={onCancel} className="min-h-11 text-sm font-medium text-ink-soft underline">
          Cancelar
        </button>
      ) : null}
    </div>
  );
}
