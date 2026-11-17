import Image from "next/image";
import Link from "next/link";
import { SplitTitle } from "@/components/motion/SplitTitle";

export type RunwayItem = {
  id: string;
  name: string;
  /** Precio ya formateado. */
  price: string;
  /** Texto de la etiqueta ("Nuevo", "Oferta"…), si tiene. */
  tag?: string;
  image: { src: string; width: number; height: number; alt: string };
};

type Props = {
  eyebrow: string;
  title: string;
  items: RunwayItem[];
  swipeHint: string;
  cta: string;
  /** Adónde lleva el botón (el catálogo). */
  href: string;
};

/**
 * Pasarela de destacados: una fila de zapatos que se desliza con el dedo. Cada
 * uno lleva a su página. Es contenido puro: ScrollStory la anima por las marcas
 *   [data-chapter]      la sección (título letra por letra, textos con fundido)
 *   [data-runway-track] la fila, que se corre un poco con el scroll
 *   [data-runway-card]  cada zapato, que entra escalonado
 * Sin JavaScript o con movimiento reducido se ve igual, quieta.
 */
export function Runway({ eyebrow, title, items, swipeHint, cta, href }: Props) {
  return (
    // overflow-x-clip: la fila arranca corrida hacia la derecha para animarse; sin
    // esto estiraba la página más que la pantalla del celular.
    <section
      data-chapter
      className="relative overflow-x-clip pt-[10svh] pb-[10svh] lg:pt-[16svh] lg:pb-[14svh]"
    >
      <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
        <p
          data-reveal
          className="mb-3 flex items-center gap-3 text-xs font-medium tracking-[0.18em] text-mint-soft uppercase lg:mb-5 lg:text-base"
        >
          <span className="block h-px w-10 bg-mint-soft" />
          <span>{eyebrow}</span>
        </p>
        <div className="flex items-end justify-between gap-6">
          <SplitTitle
            text={title}
            className="font-display text-[13.5vw] leading-[0.92] font-normal text-paper lg:text-[clamp(4rem,7vw,8rem)]"
          />
          <Link
            data-reveal
            href={href}
            className="mb-3 hidden min-h-12 shrink-0 items-center rounded-full bg-rust px-8 text-base font-semibold tracking-[0.1em] text-paper uppercase transition-transform hover:scale-[1.03] lg:inline-flex"
          >
            {cta}
          </Link>
        </div>
      </div>

      <ul
        data-runway-track
        className="runway mt-8 gap-4 px-5 lg:mx-auto lg:mt-14 lg:max-w-[1500px] lg:gap-6 lg:px-10"
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            data-runway-card
            className="w-[72vw] max-w-[340px] shrink-0 snap-center lg:w-auto lg:max-w-none lg:flex-1"
          >
            <Link href={`/producto/${item.id}`} className="group block">
              <span className="relative block aspect-[4/3]">
                <span className="runway-glow absolute -inset-[8%]" />
                <span className="stage-shadow absolute inset-x-[10%] bottom-[2%] h-[16%] transition-transform duration-500 group-hover:scale-x-90" />
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(min-width: 1024px) 24vw, 72vw"
                  loading={i < 2 ? "eager" : "lazy"}
                  className={`object-contain p-3 transition-transform duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-[1.07] group-hover:rotate-0 ${
                    i % 2 ? "rotate-3" : "-rotate-3"
                  }`}
                />
                {item.tag ? (
                  <span className="absolute top-1 left-1 rounded-full border border-gold px-3 py-1 text-xs font-semibold tracking-[0.1em] text-gold uppercase">
                    {item.tag}
                  </span>
                ) : null}
              </span>
              <span className="mt-4 flex items-baseline justify-between gap-3">
                <span className="font-display text-2xl leading-tight text-paper lg:text-3xl">
                  {item.name}
                </span>
                <span className="text-base font-semibold whitespace-nowrap text-paper lg:text-lg">
                  {item.price}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p
        data-reveal
        className="mt-6 px-5 text-xs tracking-[0.18em] text-mint-soft uppercase lg:hidden"
      >
        {swipeHint} →
      </p>
    </section>
  );
}
