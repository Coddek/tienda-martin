import Image from "next/image";
import { SplitTitle } from "@/components/motion/SplitTitle";
import type { CSSProperties } from "react";
import { brandVar } from "@/lib/theme";
import type { ChapterContent } from "../../../site.config";

/**
 * Un capítulo: número, título gigante y un párrafo corto.
 *
 * Reparto del espacio con el zapato del escenario fijo (para que nunca se pisen):
 * - celular: el texto queda en la parte de abajo y el zapato arriba;
 * - escritorio: el texto ocupa una mitad (`textSide`) y el zapato la otra.
 * Alto de scroll: 150svh = una pantalla + 50svh con el capítulo fijo.
 * Con movimiento reducido no hay escenario: la foto se muestra acá mismo.
 */
export function Chapter({
  id,
  number,
  eyebrow,
  title,
  body,
  textSide,
  shoe,
  background,
}: ChapterContent) {
  return (
    <section
      id={id}
      data-chapter
      data-text-side={textSide}
      data-bg={brandVar(background)}
      style={{ "--section-bg": `var(${brandVar(background)})` } as CSSProperties}
      className="relative h-[150svh] motion-reduce:h-auto motion-reduce:bg-(--section-bg)"
    >
      <div className="sticky top-0 flex h-svh items-end pb-[5svh] motion-reduce:static motion-reduce:h-auto motion-reduce:py-20 lg:items-center lg:pb-0">
        <div
          data-chapter-text
          className="mx-auto grid w-full max-w-[1500px] px-5 lg:grid-cols-2 lg:px-10"
        >
          <div className={textSide === "right" ? "lg:col-start-2 lg:pl-10" : "lg:pr-10"}>
            <figure className="mb-10 hidden motion-reduce:block">
              <Image
                src={shoe.src}
                width={shoe.width}
                height={shoe.height}
                alt={shoe.alt}
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="h-auto w-full max-w-[520px]"
              />
              {shoe.placeholderLabel ? (
                <figcaption className="mt-3 text-xs tracking-[0.18em] text-mint-soft uppercase">
                  {shoe.placeholderLabel}
                </figcaption>
              ) : null}
            </figure>

            <p
              data-reveal
              className="mb-3 flex items-center gap-3 text-xs font-medium tracking-[0.18em] text-mint-soft uppercase lg:mb-7 lg:text-base"
            >
              <span>{number}</span>
              <span className="block h-px w-10 bg-mint-soft" />
              <span>{eyebrow}</span>
            </p>
            <SplitTitle
              text={title}
              className="font-display text-[min(14.5vw,8.5svh)] leading-[0.92] font-normal text-paper lg:text-[clamp(4rem,7.4vw,8.5rem)]"
            />
            <p
              data-reveal
              className="mt-4 max-w-[32ch] text-base leading-normal text-paper lg:mt-9 lg:text-[1.6rem] lg:leading-[1.45]"
            >
              {body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
