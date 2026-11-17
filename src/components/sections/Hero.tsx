import { SplitTitle } from "@/components/motion/SplitTitle";

type Props = {
  eyebrow: string;
  tagline: string;
  wordmark: string;
  /** Si se pasa, se muestra como aviso chico junto al logotipo. */
  wordmarkNote?: string;
  scrollHint: string;
};

/**
 * Portada. El isotipo no vive acá sino en el escenario fijo (Stage), justo
 * encima del logotipo; este bloque ocupa los bordes.
 * Alto de scroll: 125svh. El isotipo se abre mientras la pasarela sube: en un
 * solo scroll ya se ven zapatos.
 */
export function Hero({ eyebrow, tagline, wordmark, wordmarkNote, scrollHint }: Props) {
  return (
    <section data-hero className="relative h-[125svh] motion-reduce:h-svh">
      <div className="sticky top-0 flex h-svh flex-col justify-between px-5 pt-20 pb-7 lg:px-10 lg:pt-24 lg:pb-8">
        <div
          data-hero-fade
          className="flex items-start justify-between gap-6 text-xs font-medium tracking-[0.18em] text-mint-soft uppercase lg:text-sm"
        >
          <p>{eyebrow}</p>
          <p className="max-w-[14rem] text-right">{tagline}</p>
        </div>

        <div data-hero-fade>
          <SplitTitle
            as="h1"
            text={wordmark}
            className="text-center font-display text-[21vw] leading-[0.82] font-normal text-paper lg:text-[clamp(8rem,19vw,20rem)]"
          />
          <div className="mt-5 flex items-center justify-between text-xs tracking-[0.18em] text-mint-soft uppercase lg:text-sm">
            <span>{wordmarkNote ?? ""}</span>
            <span className="flex items-center gap-3">
              {scrollHint}
              <span className="block h-8 w-px bg-mint-soft" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
