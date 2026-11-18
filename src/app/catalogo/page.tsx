import type { Metadata } from "next";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "../../../site.config";

export const metadata: Metadata = {
  title: `${siteConfig.catalog.eyebrow} · ${siteConfig.name}`,
};

/** Catálogo solo, sin portada: el enlace directo para quien ya conoce el local. */
export default function CatalogPage() {
  const { name, nav } = siteConfig;
  return (
    <div className="min-h-svh bg-paper text-ink">
      <SiteHeader
        name={name}
        tone="light"
        homeHref={nav.homeHref}
        catalogLabel={nav.catalogLabel}
        catalogHref={nav.catalogHref}
      />
      <main>
        <CatalogSection headingAs="h1" className="pt-[calc(6rem+var(--announce-h,0px))] pb-24 lg:pt-[calc(8rem+var(--announce-h,0px))]" />
      </main>
    </div>
  );
}
