"use client";

import type { Ref } from "react";
import { IsotipoMark } from "@/components/brand/IsotipoMark";
import { ISOTIPO_VIEWBOX, type IsotipoHandle } from "@/components/brand/isotipo-paths";

type Props = {
  use3D: boolean;
  isotipoRef: Ref<IsotipoHandle>;
};

/**
 * Escenario fijo detrás del contenido: el fondo con sus luces y el isotipo, que
 * se abre como una puerta al scrollear. No recibe clics y va por debajo del
 * contenido (z-0 contra z-10), así que nunca tapa textos ni zapatos.
 * Solo marcado: quién lo mueve es ScrollStory.
 */
export function Stage({ use3D, isotipoRef }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-svh overflow-hidden motion-reduce:absolute"
    >
      <div className="absolute inset-0 bg-ink" />
      <div className="stage-aurora absolute -inset-[10%]" />
      <div
        data-isotipo
        className="absolute top-[60svh] left-1/2 w-[84vw] max-w-[340px] -translate-x-1/2 -translate-y-1/2 text-gold lg:top-[40svh] lg:w-[min(40vw,600px)] lg:max-w-none"
      >
        <IsotipoMark
          ref={isotipoRef}
          use3D={use3D}
          className="w-full"
          style={{ aspectRatio: `${ISOTIPO_VIEWBOX.width} / ${ISOTIPO_VIEWBOX.height}` }}
        />
      </div>
    </div>
  );
}
