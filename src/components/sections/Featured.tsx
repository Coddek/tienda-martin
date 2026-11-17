import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { SplitTitle } from "@/components/motion/SplitTitle";

export type FeaturedItem = {
  id: string;
  name: string;
  /** Precio ya formateado. */
  price: string;
  image: { src: string; width: number; height: number; alt: string };
};

type Props = {
  eyebrow: string;
  title: string;
  /** El producto grande: es el zapato del escenario fijo. */
  lead: FeaturedItem;
  /** El resto de los destacados, en miniatura. */
  others: FeaturedItem[];
  cta: string;
  /** Adónde llevan las miniaturas y el botón (el catálogo). */
  href: string;
  /** Variable CSS del color de fondo (ver brandVar). */
  backgroundVar: string;
  textSide: "left" | "right";
  placeholderLabel?: string;
};

/**
 * Destacados: un producto en grande (el del escenario) y los demás en miniatura.
 * Usa las mismas marcas `data-*` que un capítulo, así ScrollStory lo anima igual.
 * Reparto con el zapato del escenario: en celular el texto va abajo y el zapato
 * arriba; en escritorio, cada uno en una mitad.
 * Alto de scroll: 150svh = una pantalla + 50svh con la sección fija.
 */
export function Featured({
  eyebrow,
  title,
  lead,
  others,
  cta,
  href,
  backgroundVar,
  textSide,
  placeholderLabel,
}: Props) {
  return (
    <section
      data-chapter
      data-text-side={textSide}
      data-bg={backgroundVar}
      style={{ "--section-bg": `var(${backgroundVar})` } as CSSProperties}
      className="relative h-[150svh] motion-reduce:h-auto motion-reduce:bg-(--section-bg)"
    >
      <div className="sticky top-0 flex h-svh items-end pb-[4svh] motion-reduce:static motion-reduce:h-auto motion-reduce:py-20 lg:items-center lg:pb-0">
        <div
          data-chapter-text
          className="mx-auto grid w-full max-w-[1500px] px-5 lg:grid-cols-2 lg:px-10"
        >
          <div className={textSide === "right" ? "lg:col-start-2 lg:pl-10" : "lg:pr-10"}>
            <figure className="mb-10 hidden motion-reduce:block">
              <Image
                src={lead.image.src}
                width={lead.image.width}
                height={lead.image.height}
                alt={lead.image.alt}
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="h-auto w-full max-w-[520px]"
              />
              {placeholderLabel ? (
                <figcaption className="mt-3 text-xs tracking-[0.18em] text-mint-soft uppercase">
                  {placeholderLabel}
                </figcaption>
              ) : null}
            </figure>

            <p
              data-reveal
              className="mb-3 flex items-center gap-3 text-xs font-medium tracking-[0.18em] text-mint-soft uppercase lg:mb-6 lg:text-base"
            >
              <span className="block h-px w-10 bg-mint-soft" />
              <span>{eyebrow}</span>
            </p>
            <SplitTitle
              text={title}
              className="font-display text-[min(13.5vw,8svh)] leading-[0.92] font-normal text-paper lg:text-[clamp(4rem,7vw,8rem)]"
            />
            <p data-reveal className="mt-3 text-base text-paper lg:mt-6 lg:text-2xl">
              {lead.name} <span className="text-mint-soft">·</span>{" "}
              <span className="font-semibold">{lead.price}</span>
            </p>

            <ul data-reveal className="mt-4 grid grid-cols-3 gap-3 lg:mt-9 lg:max-w-[560px] lg:gap-4">
              {others.map((item) => (
                <li key={item.id}>
                  <Link href={href} className="group block">
                    <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-mint-soft">
                      <Image
                        src={item.image.src}
                        alt={item.image.alt}
                        fill
                        sizes="(min-width: 1024px) 180px, 30vw"
                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105 lg:p-3"
                      />
                    </span>
                    <span className="mt-2 block truncate text-xs text-mint-soft lg:text-sm">
                      {item.name}
                    </span>
                    <span className="block text-sm font-semibold text-paper lg:text-base">
                      {item.price}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              data-reveal
              href={href}
              className="mt-9 hidden min-h-12 items-center rounded-full bg-rust px-8 text-base font-semibold tracking-[0.1em] text-paper uppercase transition-transform hover:scale-[1.03] lg:inline-flex"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
