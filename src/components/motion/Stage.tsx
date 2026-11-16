"use client";

import Image from "next/image";
import type { Ref } from "react";
import { IsotipoMark } from "@/components/brand/IsotipoMark";
import type { IsotipoHandle } from "@/components/brand/isotipo-paths";
import type { ShoeImage } from "../../../site.config";

type Props = {
  shoes: readonly ShoeImage[];
  use3D: boolean;
  isotipoRef: Ref<IsotipoHandle>;
  shoeRef: Ref<HTMLDivElement>;
};

/**
 * Escenario fijo detrás del contenido: el zapato protagonista y, por delante,
 * el isotipo que se abre como una puerta.
 * No recibe clics y va por debajo del texto (z-0 contra z-10), así que nunca lo tapa.
 * Solo marcado: quién lo mueve es ScrollStory.
 *
 * Capas del zapato (cada una se anima por separado para dar profundidad):
 *   shoeRef            posición y escala
 *   [data-shoe-glow]   halo, se mueve menos que el zapato (parallax)
 *   [data-shoe-shadow] sombra de apoyo
 *   [data-shoe-tilt]   rotación y seguimiento del puntero
 *   [data-shoe-float]  flotación en reposo
 */
export function Stage({ shoes, use3D, isotipoRef, shoeRef }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-svh overflow-hidden motion-reduce:absolute"
    >
      <div
        ref={shoeRef}
        className="invisible absolute top-1/2 left-1/2 w-[78vw] max-w-[420px] motion-reduce:hidden lg:w-[min(40vw,600px)] lg:max-w-none"
      >
        <div data-shoe-glow className="stage-glow absolute -inset-[24%]" />
        <div
          data-shoe-shadow
          className="stage-shadow absolute inset-x-[6%] -bottom-[9%] h-[20%]"
        />
        <div data-shoe-tilt>
          <div data-shoe-float className="relative">
            {shoes.map((shoe, i) => (
              <Image
                key={shoe.src}
                data-shoe
                src={shoe.src}
                width={shoe.width}
                height={shoe.height}
                alt=""
                sizes="(min-width: 1024px) 40vw, 78vw"
                loading={i === 0 ? "eager" : "lazy"}
                className={
                  i === 0
                    ? "relative h-auto w-full"
                    : "absolute inset-0 h-full w-full object-contain"
                }
              />
            ))}
          </div>
        </div>
        {shoes[0]?.placeholderLabel ? (
          <p className="mt-8 text-center text-[0.68rem] tracking-[0.18em] text-mint-soft uppercase lg:text-xs">
            {shoes[0].placeholderLabel}
          </p>
        ) : null}
      </div>

      <div
        data-isotipo
        className="absolute top-[60svh] left-1/2 w-[84vw] max-w-[340px] -translate-x-1/2 -translate-y-1/2 lg:top-[40svh] lg:w-[min(40vw,600px)] lg:max-w-none"
      >
        <IsotipoMark ref={isotipoRef} use3D={use3D} className="aspect-[186/112] w-full" />
      </div>
    </div>
  );
}
