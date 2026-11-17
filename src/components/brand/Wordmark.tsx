import type { CSSProperties } from "react";
import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from "./wordmark-paths";

const ratio = `${WORDMARK_VIEWBOX.width} / ${WORDMARK_VIEWBOX.height}`;

/**
 * Logotipo MARTIN en SVG, del color del texto (currentColor). Con `animated`
 * cada letra lleva `data-char` y ScrollStory las hace subir de a una; el SVG
 * recorta lo que queda fuera, así entran como desde una ranura.
 */
export function Wordmark({
  label,
  className,
  animated = false,
}: {
  label: string;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_VIEWBOX.width} ${WORDMARK_VIEWBOX.height}`}
      role="img"
      aria-label={label}
      fill="currentColor"
      className={className}
    >
      {WORDMARK_LETTERS.map((d, i) =>
        animated ? (
          // Dos capas a propósito: la entrada mueve el grupo y la salida la letra.
          // Si las dos animaran el mismo elemento, al recalcular el scroll GSAP
          // restaura el transform guardado y la letra queda trabada abajo.
          <g key={i} data-char="">
            <path d={d} fillRule="evenodd" data-letter="" />
          </g>
        ) : (
          <path key={i} d={d} fillRule="evenodd" />
        ),
      )}
    </svg>
  );
}

/**
 * El mismo logotipo como archivo (public/logotipo.svg) pintado con el color del
 * texto: para el encabezado y el pie, así el trazo no se repite en cada página.
 */
export function WordmarkImage({ label, className }: { label: string; className?: string }) {
  const style: CSSProperties = {
    aspectRatio: ratio,
    maskImage: "url(/logotipo.svg)",
    WebkitMaskImage: "url(/logotipo.svg)",
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "left center",
    WebkitMaskPosition: "left center",
  };
  return <span role="img" aria-label={label} className={`block bg-current ${className ?? ""}`} style={style} />;
}
