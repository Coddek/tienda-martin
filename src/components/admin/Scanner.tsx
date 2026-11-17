
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { cleanBarcode, isValidBarcode } from "@/lib/ean";

type Detector = { detect: (source: HTMLVideoElement | HTMLCanvasElement) => Promise<{ rawValue: string }[]> };

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/**
 * Lector nativo del navegador si existe (Chrome en Android); si no (iPhone),
 * el de respaldo, que se descarga recién acá: la página pública nunca lo baja.
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
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: FORMATS as never });
}

type Props = {
  onDetect: (code: string) => void;
  onCancel?: () => void;
};

/**
 * Cámara trasera + lectura del código de barras de la caja. Pide la misma
 * lectura dos veces seguidas y que cierre el dígito de control, así nunca toma
 * una lectura a medias. Siempre se puede tipear el número de la etiqueta.
 */
export function Scanner({ onDetect, onCancel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let cancelled = false;
    let last = "";
    let lastAt = 0;

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
          // Más resolución = el código se lee aunque la caja esté a más distancia.
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const detector = await createDetector();
        if (cancelled) return;
        setStatus("scanning");
        // Un cuadro se lee entero y el siguiente solo el recuadro guía, ampliado:
        // probado con las fotos de las etiquetas, un código chico en la imagen
        // completa no se lee y ampliado sí.
        const zoom = document.createElement("canvas");
        const zoomCtx = zoom.getContext("2d");
        let frame = 0;
        const tick = async () => {
          if (cancelled || done.current || !video.current) return;
          try {
            const v = video.current;
            if (v.readyState >= 2 && v.videoWidth) {
              let source: HTMLVideoElement | HTMLCanvasElement = v;
              if (frame++ % 2 === 1 && zoomCtx) {
                const sw = v.videoWidth * 0.8;
                const sh = v.videoHeight * 0.5;
                const scale = Math.min(2, 1600 / sw);
                zoom.width = Math.round(sw * scale);
                zoom.height = Math.round(sh * scale);
                zoomCtx.imageSmoothingQuality = "high";
                zoomCtx.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, zoom.width, zoom.height);
                source = zoom;
              }
              const found = await detector.detect(source);
              const code = found.map((f) => cleanBarcode(f.rawValue)).find(isValidBarcode);
              // Dos lecturas iguales en menos de 1,5 s (puede haber cuadros sin
              // lectura en el medio: se alternan entero y ampliado).
              if (code) {
                const now = performance.now();
                if (code === last && now - lastAt < 1500) finish(code);
                last = code;
                lastAt = now;
              }
            }
          } catch {
            // un cuadro que no se pudo leer: se prueba con el siguiente
          }
          timer = window.setTimeout(tick, 180);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink">
        <video ref={video} playsInline muted className="h-full w-full object-cover" />
        {/* Guía: dónde poner el código. */}
        {status === "scanning" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[42%] w-[78%] rounded-2xl border-2 border-gold shadow-[0_0_0_9999px_rgba(18,50,35,0.35)]" />
          </div>
        ) : null}
        <p className="absolute inset-x-0 bottom-0 bg-ink/70 px-4 py-2 text-center text-sm text-paper">
          {status === "starting"
            ? "Abriendo la cámara…"
            : status === "scanning"
              ? "Apuntá al código de barras de la caja, a un palmo de distancia."
              : error}
        </p>
      </div>

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
