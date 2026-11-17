import type { CSSProperties } from "react";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { Featured, type FeaturedItem } from "@/components/sections/Featured";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { products } from "@/data/products";
import { brandVar } from "@/lib/theme";
import { formatPrice } from "@/lib/whatsapp";
import { siteConfig } from "../../site.config";

/**
 * Portada corta: logotipo → destacados → catálogo → pie.
 * Quien vuelve a comprar toca "Catálogo" arriba y baja directo a la grilla.
 */
export default function Home() {
  const { name, nav, hero, wordmark, featured, marquee, footer, contact, locale, preview } =
    siteConfig;

  const items: FeaturedItem[] = featured.productIds.flatMap((id) => {
    const product = products.find((p) => p.id === id);
    return product
      ? [{ id, name: product.name, price: formatPrice(product.price, locale), image: product.image }]
      : [];
  });
  const [lead, ...others] = items;
  const catalogHash = `#${nav.catalogAnchor}`;
  const paper = brandVar("paper");
  const whatsappDigits = contact.whatsapp.replace(/\D/g, "");

  return (
    <>
      <SiteHeader
        name={name}
        tone="dark"
        homeHref={nav.homeHref}
        catalogLabel={nav.catalogLabel}
        catalogHref={catalogHash}
      />
      <main>
        <ScrollStory
          shoes={
            lead ? [{ ...lead.image, placeholderLabel: preview ? featured.placeholderLabel : undefined }] : []
          }
          backdropWords={[featured.backdropWord]}
        >
          <Hero
            eyebrow={hero.eyebrow}
            tagline={hero.tagline}
            wordmark={wordmark.text}
            wordmarkNote={preview && wordmark.provisional ? wordmark.provisionalLabel : undefined}
            scrollHint={hero.scrollHint}
          />
          {lead ? (
            <Featured
              eyebrow={featured.eyebrow}
              title={featured.title}
              lead={lead}
              others={others.slice(0, 3)}
              cta={featured.cta}
              href={catalogHash}
              backgroundVar={brandVar(featured.background)}
              textSide={featured.textSide}
              placeholderLabel={preview ? featured.placeholderLabel : undefined}
            />
          ) : null}
          <Marquee words={marquee} />
          <section
            id={nav.catalogAnchor}
            data-closing
            data-bg={paper}
            style={{ "--section-bg": `var(${paper})` } as CSSProperties}
            className="relative scroll-mt-0 bg-(--section-bg) text-ink"
          >
            <CatalogSection className="pt-24 pb-24 lg:pt-28" />
          </section>
        </ScrollStory>
      </main>
      <SiteFooter
        name={name}
        tagline={hero.tagline}
        visitTitle={footer.visitTitle}
        contactTitle={footer.contactTitle}
        address={contact.address}
        hours={contact.hours}
        directionsLabel={footer.directions}
        whatsappLabel={footer.whatsappLabel}
        whatsappHref={whatsappDigits ? `https://wa.me/${whatsappDigits}` : ""}
        instagramLabel={footer.instagramLabel}
        instagram={contact.instagram}
        pending={footer.pending}
        note={preview ? footer.note : undefined}
      />
    </>
  );
}
