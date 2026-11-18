import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "../../site.config";

/** Página para enlaces rotos o productos dados de baja: en el idioma y estilo del sitio. */
export default function NotFound() {
  const { name, nav, notFound } = siteConfig;
  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      <SiteHeader
        name={name}
        tone="light"
        homeHref={nav.homeHref}
        catalogLabel={nav.catalogLabel}
        catalogHref={nav.catalogHref}
      />
      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col justify-center px-5 pt-[calc(7rem+var(--announce-h,0px))] pb-24 lg:px-10">
        <p className="text-sm font-medium tracking-[0.16em] text-ink-soft uppercase">
          {notFound.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] text-ink lg:text-7xl">
          {notFound.title}
        </h1>
        <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-ink-soft">{notFound.body}</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href={nav.catalogHref}
            className="inline-flex min-h-13 items-center justify-center rounded-full bg-rust px-8 text-base font-semibold tracking-[0.08em] text-paper uppercase"
          >
            {notFound.cta}
          </Link>
          <Link
            href={nav.homeHref}
            className="inline-flex min-h-13 items-center justify-center rounded-full border border-ink px-8 text-base font-semibold tracking-[0.08em] text-ink uppercase transition-colors hover:bg-ink hover:text-paper"
          >
            {notFound.home}
          </Link>
        </div>
      </main>
    </div>
  );
}
