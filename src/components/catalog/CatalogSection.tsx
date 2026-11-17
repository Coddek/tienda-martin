import type { ElementType } from "react";
import { categoriesOf, getCatalog, sizesOf } from "@/lib/catalog";
import { siteConfig } from "../../../site.config";
import { CatalogGrid } from "./CatalogGrid";

/** Textos del selector de talle, iguales en la tarjeta y en la ficha. */
export const sizePickerLabels = () => ({
  label: siteConfig.catalog.sizeLabel,
  soldOut: siteConfig.catalog.soldOut,
  ...siteConfig.catalog.stock,
});

type Props = {
  /** Nivel del título: h1 en la página del catálogo, h2 dentro de la portada. */
  headingAs?: ElementType;
  className?: string;
};

/** Catálogo completo: título, aviso de ejemplo, cómo comprar y la grilla con filtros. */
export async function CatalogSection({ headingAs: Heading = "h2", className }: Props) {
  const { catalog, contact, locale, preview } = siteConfig;
  const products = await getCatalog();
  return (
    <div className={`mx-auto max-w-[1300px] px-5 lg:px-10 ${className ?? ""}`}>
      <p className="text-xs font-medium tracking-[0.18em] text-ink-soft uppercase lg:text-sm">
        {catalog.eyebrow}
      </p>
      <Heading className="mt-2 font-display text-6xl leading-[0.95] text-ink lg:text-8xl">
        {catalog.title}
      </Heading>

      {preview ? (
        <p className="mt-5 rounded-xl border border-dashed border-ink-soft px-4 py-3 text-sm text-ink-soft">
          {catalog.exampleNotice}
        </p>
      ) : null}

      {catalog.paymentNote ? (
        <p className="mt-4 text-sm font-medium text-ink">{catalog.paymentNote}</p>
      ) : null}

      <ol className="mt-6 mb-4 grid gap-3 sm:grid-cols-3">
        {catalog.howToBuy.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl bg-mint-soft px-5 py-4">
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
        categories={categoriesOf(products)}
        sizes={sizesOf(products)}
        allLabel={catalog.allLabel}
        sizeFilterLabel={catalog.sizeFilterLabel}
        emptyLabel={catalog.emptyLabel}
        sortLabel={catalog.sortLabel}
        sortOptions={catalog.sortOptions}
        favoritesLabels={catalog.favorites}
        labels={{
          tags: catalog.tags,
          viewProduct: catalog.viewProduct,
          colorLabel: catalog.colorLabel,
          addFavorite: catalog.favorites.add,
          removeFavorite: catalog.favorites.remove,
          sizeLabel: catalog.sizeLabel,
          pickSize: catalog.pickSize,
          sizePicker: sizePickerLabels(),
          cta: catalog.cta,
          whatsappMessage: catalog.whatsappMessage,
        }}
        whatsapp={contact.whatsapp}
        locale={locale}
      />
    </div>
  );
}
