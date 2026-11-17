import { Wordmark } from "@/components/brand/Wordmark";

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

        <div>
          {/* Recorta solo en vertical: las letras entran desde abajo como por una
              ranura, y al salir pueden abrirse hacia los costados sin cortarse. */}
          <h1 className="overflow-y-clip text-paper">
            {/* En escritorio, al ancho que tenía el título en letras: deja lugar al isotipo encima. */}
            <Wordmark
              label={wordmark}
              animated
              className="mx-auto block w-full overflow-visible lg:w-[62vw] lg:max-w-[1100px]"
            />
          </h1>
          <div
            data-hero-fade
            className="mt-5 flex items-center justify-between text-xs tracking-[0.18em] text-mint-soft uppercase lg:text-sm"
          >
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
