import { useEffect, useRef, useState, type SubmitEvent } from "react";
import {
  captureFrame,
  cleanBarcode,
  GUIDE,
  isValidBarcode,
  shareOrDownload,
  startScanner,
  type ScanDiagnostics,
} from "@/lib/barcode-scanner";

/** Después de esto sin leer, se muestran consejos. */
const HINT_AFTER_MS = 8000;

type Props = {
  onDetect: (code: string) => void;
  onCancel?: () => void;
};

/**
 * Cámara trasera + lectura del código de barras de la caja (motor en
 * src/lib/barcode-scanner.ts). Siempre se puede tipear el número de la
 * etiqueta. Con «Diagnóstico» se ve qué está pasando adentro y se puede
 * guardar un cuadro de la cámara para revisarlo.
 */
export function Scanner({ onDetect, onCancel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<ReturnType<typeof startScanner> | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "slow" | "error">("starting");
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const [showDiag, setShowDiag] = useState(false);
  const [diag, setDiag] = useState<ScanDiagnostics | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!video.current) return;
    let hintTimer = 0;
    const s = startScanner(video.current, {
      onCode: onDetect,
      onReady: () => {
        setStatus("scanning");
        hintTimer = window.setTimeout(() => setStatus((st) => (st === "scanning" ? "slow" : st)), HINT_AFTER_MS);
      },
      onError: (message) => {
        setError(message);
        setStatus("error");
      },
    });
    scanner.current = s;
    return () => {
      window.clearTimeout(hintTimer);
      s.stop();
      scanner.current = null;
    };
  }, [onDetect]);

  // Mientras el diagnóstico está abierto, se actualiza dos veces por segundo.
  useEffect(() => {
    if (!showDiag) return;
    const id = window.setInterval(() => setDiag(scanner.current?.diagnostics() ?? null), 500);
    return () => window.clearInterval(id);
  }, [showDiag]);

  const submitTyped = (event: SubmitEvent) => {
    event.preventDefault();
    const code = cleanBarcode(typed);
    if (!isValidBarcode(code)) {
      setTypedError("Ese número no es válido. Revisalo en la etiqueta (son 13 dígitos).");
      return;
    }
    scanner.current?.stop();
    onDetect(code);
  };

  const diagText = diag
    ? [
        `Lector v${diag.version} · ${diag.reader} · motor: ${diag.engine}`,
        `Cámara: ${diag.camera} · zoom: ${diag.zoom}`,
        `Cuadros analizados: ${diag.frames} · ${diag.msPerFrame} ms c/u`,
        `Lecturas: ${diag.reads.length ? diag.reads.join(", ") : "ninguna"}`,
        `Último error: ${diag.lastError ?? "ninguno"}`,
        `Navegador: ${navigator.userAgent}`,
      ].join("\n")
    : "Cargando…";

  const message =
    status === "starting"
      ? "Abriendo la cámara y el lector…"
      : status === "scanning"
        ? "Poné el código de barras adentro del recuadro, a unos 20–30 cm."
        : status === "slow"
          ? "Todavía no lee: alejá el celular hasta que el código se vea nítido (de muy cerca no enfoca), con buena luz y sin reflejo. O tipeá los números abajo."
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

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setShowDiag(!showDiag);
            setDiag(scanner.current?.diagnostics() ?? null);
          }}
          className="min-h-11 self-center text-xs font-medium text-ink-soft underline"
        >
          {showDiag ? "Ocultar diagnóstico" : "¿No anda? Ver diagnóstico"}
        </button>
        {showDiag ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-mint p-3">
            <pre className="text-[0.7rem] leading-relaxed break-words whitespace-pre-wrap text-ink">{diagText}</pre>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const blob = video.current ? await captureFrame(video.current) : null;
                  if (blob) await shareOrDownload(blob, `camara-lector-${Date.now()}.jpg`);
                }}
                className="min-h-11 flex-1 rounded-2xl border border-ink-soft text-sm font-medium"
              >
                Guardar cuadro
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(diagText);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  } catch {
                    // sin portapapeles: se puede sacar captura de pantalla
                  }
                }}
                className="min-h-11 flex-1 rounded-2xl border border-ink-soft text-sm font-medium"
              >
                {copied ? "Copiado ✓" : "Copiar datos"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {onCancel ? (
        <button type="button" onClick={onCancel} className="min-h-11 text-sm font-medium text-ink-soft underline">
          Cancelar
        </button>
      ) : null}
    </div>
  );
}
