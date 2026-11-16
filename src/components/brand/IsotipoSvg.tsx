"use client";

import { useId, useImperativeHandle, useRef, type Ref } from "react";
import { ISOTIPO_SHAPES, ISOTIPO_VIEWBOX, type IsotipoHandle } from "./isotipo-paths";

type Props = {
  ref?: Ref<IsotipoHandle>;
  className?: string;
};

/**
 * Isotipo plano con degradé metálico. Es la versión de celular y el respaldo
 * mientras carga (o si falla) el 3D. Se abre como una puerta: cada forma se
 * corre a su costado y se angosta, sin transparencias.
 */
export function IsotipoSvg({ ref, className }: Props) {
  const left = useRef<SVGPathElement>(null);
  const right = useRef<SVGPathElement>(null);
  const gradient = useId();

  useImperativeHandle(ref, () => ({
    setSplit(value) {
      const v = Math.min(1, Math.max(0, value));
      const open = v * v * (3 - 2 * v);
      // 2,2 anchos de isotipo alcanza para salir de cualquier pantalla de celular.
      const dx = open * ISOTIPO_VIEWBOX.width * 2.2;
      const squeeze = 1 - open * 0.65;
      if (left.current) left.current.style.transform = `translateX(${-dx}px) scaleX(${squeeze})`;
      if (right.current) right.current.style.transform = `translateX(${dx}px) scaleX(${squeeze})`;
    },
  }));

  const shape = {
    fill: `url(#${gradient})`,
    fillRule: "evenodd" as const,
    style: { transformBox: "fill-box" as const, transformOrigin: "center" },
  };

  return (
    <svg
      viewBox={`0 0 ${ISOTIPO_VIEWBOX.width} ${ISOTIPO_VIEWBOX.height}`}
      className={className}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--brand-gold) 70%, var(--brand-paper))" />
          <stop offset="0.45" stopColor="var(--brand-gold)" />
          <stop offset="0.6" stopColor="color-mix(in srgb, var(--brand-gold) 45%, var(--brand-paper))" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--brand-gold) 80%, var(--brand-ink))" />
        </linearGradient>
      </defs>
      <path ref={left} d={ISOTIPO_SHAPES.left} {...shape} />
      <path ref={right} d={ISOTIPO_SHAPES.right} {...shape} />
    </svg>
  );
}
