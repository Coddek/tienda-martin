import type { Metadata } from "next";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { categories, products } from "@/data/products";
import { siteConfig } from "../../../site.config";

export const metadata: Metadata = {
  title: `${siteConfig.catalog.eyebrow} · ${siteConfig.name}`,
};

export default function CatalogPage() {
  const { name, nav, catalog, contact, locale, preview } = siteConfig;
  return (
    <div className="min-h-svh bg-paper text-ink">
      <SiteHeader name={name} tone="light" {...nav} />
      <main className="mx-auto max-w-[1300px] px-5 pt-24 pb-24 lg:px-10 lg:pt-32">
        <p className="text-xs font-medium tracking-[0.18em] text-ink-soft uppercase lg:text-sm">
          {catalog.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-6xl leading-[0.95] text-ink lg:text-8xl">
          {catalog.title}
        </h1>

        {preview ? (
          <p className="mt-5 rounded-xl border border-dashed border-ink-soft px-4 py-3 text-sm text-ink-soft">
            {catalog.exampleNotice}
          </p>
        ) : null}

        <ol className="mt-8 mb-6 grid gap-4 sm:grid-cols-3">
          {catalog.howToBuy.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl bg-mint-soft p-5">
              <span className="font-display text-4xl leading-none text-ink-soft">{i + 1}</span>
              <span>
                <span className="block font-semibold text-ink">{step.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <CatalogGrid
          products={products}
          categories={categories}
          allLabel={catalog.allLabel}
          labels={{
            sizeLabel: catalog.sizeLabel,
            pickSize: catalog.pickSize,
            soldOut: catalog.soldOut,
            cta: catalog.cta,
            whatsappMessage: catalog.whatsappMessage,
          }}
          whatsapp={contact.whatsapp}
          locale={locale}
        />
      </main>
    </div>
  );
}
