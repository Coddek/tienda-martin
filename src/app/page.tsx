import { CatalogSection } from "@/components/catalog/CatalogSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollStory } from "@/components/motion/ScrollStory";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Runway, type RunwayItem } from "@/components/sections/Runway";
import { getCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/whatsapp";
import { siteConfig } from "../../site.config";

/**
 * Portada corta: logotipo → pasarela de destacados → catálogo → pie.
 * Quien vuelve a comprar toca "Catálogo" arriba y baja directo a la grilla.
 */
export default async function Home() {
  const { name, nav, hero, wordmark, featured, marquee, catalog, footer, contact, locale, preview } =
    siteConfig;

  const products = await getCatalog();
  // Los marcados como destacados; si no hay ninguno, los primeros del catálogo.
  const marked = products.filter((product) => product.featured);
  const items: RunwayItem[] = (marked.length > 0 ? marked : products.slice(0, 4)).map(
    (product) => ({
      id: product.id,
      name: product.name,
      price: formatPrice(product.price, locale),
      tag: product.tag ? catalog.tags[product.tag] : undefined,
      image: product.image,
    }),
  );
  const catalogHash = `#${nav.catalogAnchor}`;
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
        <ScrollStory>
          <Hero
            eyebrow={hero.eyebrow}
            tagline={hero.tagline}
            wordmark={wordmark.text}
            wordmarkNote={preview && wordmark.provisional ? wordmark.provisionalLabel : undefined}
            scrollHint={hero.scrollHint}
          />
          <Runway
            eyebrow={featured.eyebrow}
            title={featured.title}
            items={items}
            swipeHint={featured.swipeHint}
            cta={featured.cta}
            href={catalogHash}
          />
          <Marquee words={marquee} />
          <section id={nav.catalogAnchor} data-closing className="relative bg-paper text-ink">
            <CatalogSection className="pt-24 pb-28 lg:pt-28" />
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
        mapTitle={footer.mapTitle}
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
