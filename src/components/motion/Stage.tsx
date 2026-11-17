"use client";

import Image from "next/image";
import type { Ref } from "react";
import { IsotipoMark } from "@/components/brand/IsotipoMark";
import type { IsotipoHandle } from "@/components/brand/isotipo-paths";
import type { ShoeImage } from "../../../site.config";

type Props = {
  shoes: readonly ShoeImage[];
  /** Una palabra gigante por capítulo, en el mismo orden. */
  backdropWords: readonly string[];
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
 *   [data-stage-bg]    color de fondo, cambia por capítulo
 *   [data-backdrop-word] palabra gigante en contorno, cruza en horizontal
 *   shoeRef            posición y escala
 *   [data-shoe-glow]   halo, se mueve menos que el zapato (parallax)
 *   [data-shoe-shadow] sombra de piso (no gira con el zapato)
 *   [data-shoe-tilt]   rotación y seguimiento del puntero
 *   [data-shoe-float]  flotación en reposo
 */
export function Stage({ shoes, backdropWords, use3D, isotipoRef, shoeRef }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-svh overflow-hidden motion-reduce:absolute"
    >
      <div data-stage-bg className="absolute inset-0 bg-ink" />
      <div className="stage-aurora absolute -inset-[10%]" />

      {backdropWords.map((word) => (
        <p
          key={word}
          data-backdrop-word
          className="backdrop-word invisible absolute top-[30svh] left-0 -translate-y-1/2 font-display text-[34vw] leading-none whitespace-nowrap italic motion-reduce:hidden lg:top-1/2 lg:text-[24vw]"
        >
          {word}
        </p>
      ))}

      <div
        ref={shoeRef}
        className="invisible absolute top-1/2 left-1/2 w-[min(74vw,36svh)] motion-reduce:hidden lg:w-[min(40vw,600px)]"
      >
        <div className="relative">
          <div data-shoe-glow className="stage-glow absolute -inset-[24%]" />
          <div
            data-shoe-shadow
            className="stage-shadow absolute inset-x-[2%] top-[84%] h-[24%]"
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
        </div>
        {shoes[0]?.placeholderLabel ? (
          <p className="mt-5 text-center text-[0.62rem] tracking-[0.16em] whitespace-nowrap text-mint-soft uppercase lg:mt-9 lg:text-xs">
            {shoes[0].placeholderLabel}
          </p>
        ) : null}
      </div>

      <div
        data-isotipo
        className="absolute top-[60svh] left-1/2 w-[84vw] max-w-[340px] -translate-x-1/2 -translate-y-1/2 text-gold lg:top-[40svh] lg:w-[min(40vw,600px)] lg:max-w-none"
      >
        <IsotipoMark ref={isotipoRef} use3D={use3D} className="aspect-[186/112] w-full" />
      </div>
    </div>
  );
}
