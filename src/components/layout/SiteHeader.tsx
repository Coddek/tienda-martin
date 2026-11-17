import Link from "next/link";
import { WordmarkImage } from "@/components/brand/Wordmark";

type Props = {
  name: string;
  homeHref: string;
  catalogLabel: string;
  catalogHref: string;
  /** "dark": sobre el recorrido (fondo oscuro). "light": sobre el catálogo (fondo claro). */
  tone: "dark" | "light";
};

/**
 * Encabezado fijo, visible desde el primer segundo: quien ya conoce el local
 * entra directo al catálogo sin pasar por el recorrido.
 */
export function SiteHeader({ name, homeHref, catalogLabel, catalogHref, tone }: Props) {
  const dark = tone === "dark";
  return (
    <header
      data-site-header
      className={`fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-3 lg:px-10 lg:py-4 ${
        dark
          ? "text-paper transition-colors duration-300 motion-reduce:absolute data-[solid]:bg-paper data-[solid]:text-ink"
          : "border-b border-mint bg-paper text-ink"
      }`}
    >
      <Link href={homeHref} className="block py-2" aria-label={name}>
        <WordmarkImage label={name} className="h-5 lg:h-7" />
      </Link>
      <Link
        href={catalogHref}
        className="inline-flex min-h-11 items-center rounded-full bg-rust px-5 text-sm font-semibold tracking-[0.12em] text-paper uppercase transition-transform hover:scale-[1.04]"
      >
        {catalogLabel}
      </Link>
    </header>
  );
}
