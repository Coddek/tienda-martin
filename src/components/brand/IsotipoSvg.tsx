"use client";

import { useId, useImperativeHandle, useRef, type Ref } from "react";
import { ISOTIPO_FULL, ISOTIPO_LENS, ISOTIPO_VIEWBOX, type IsotipoHandle } from "./isotipo-paths";

type Props = {
  ref?: Ref<IsotipoHandle>;
  className?: string;
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * Isotipo plano con degradé metálico. Es la versión de celular y el respaldo
 * mientras carga (o si falla) el 3D. Al scrollear se "atraviesa": crece hacia
 * el óvalo del medio hasta que la pantalla pasa por adentro, y recién al final
 * se desvanece. Solo cambia transform y opacidad (barato en el celular).
 */
export function IsotipoSvg({ ref, className }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const gradient = useId();

  useImperativeHandle(ref, () => ({
    setSplit(value) {
      const node = svg.current;
      if (!node) return;
      const v = clamp01(value);
      const travel = clamp01((v - 0.08) / 0.92);
      // Lento al principio, cada vez más rápido. En el celular el isotipo ya ocupa
      // casi todo el ancho: con 25 veces alcanza para que la pantalla quede
      // adentro del óvalo, y la curva es suave para que no se vaya de golpe.
      const scale = 1 + 24 * travel ** 3;
      const fade = 1 - clamp01((v - 0.82) / 0.18);
      node.style.transform = scale === 1 ? "" : `scale(${scale.toFixed(3)})`;
      node.style.opacity = fade === 1 ? "" : fade.toFixed(3);
    },
  }));

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${ISOTIPO_VIEWBOX.width} ${ISOTIPO_VIEWBOX.height}`}
      className={className}
      style={{
        overflow: "visible",
        // Crece desde el óvalo del medio: por ahí "se pasa".
        transformOrigin: `${(ISOTIPO_LENS.x / ISOTIPO_VIEWBOX.width) * 100}% ${(ISOTIPO_LENS.y / ISOTIPO_VIEWBOX.height) * 100}%`,
        willChange: "transform, opacity",
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradient}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={ISOTIPO_VIEWBOX.width}
          y2={ISOTIPO_VIEWBOX.height}
        >
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--brand-gold) 70%, var(--brand-paper))" }} />
          <stop offset="0.45" style={{ stopColor: "var(--brand-gold)" }} />
          <stop offset="0.6" style={{ stopColor: "color-mix(in srgb, var(--brand-gold) 45%, var(--brand-paper))" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--brand-gold) 80%, var(--brand-ink))" }} />
        </linearGradient>
      </defs>
      {/* Si el degradé no se puede resolver, queda el dorado liso (currentColor). */}
      <path d={ISOTIPO_FULL} fill={`url(#${gradient}) currentColor`} fillRule="evenodd" />
    </svg>
  );
}
