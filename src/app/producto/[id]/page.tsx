import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetail } from "@/components/catalog/ProductDetail";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getProduct, products } from "@/data/products";
import { formatPrice } from "@/lib/whatsapp";
import { siteConfig } from "../../../../site.config";

type PageProps = { params: Promise<{ id: string }> };

// Una página fija por producto: se generan todas en el build y cargan al instante.
export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

// El título y la foto son lo que se ve al pegar el enlace en WhatsApp o Instagram.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return {};
  const description = `${product.category} · ${formatPrice(product.price, siteConfig.locale)}`;
  return {
    title: `${product.name} · ${siteConfig.name}`,
    description,
    openGraph: {
      title: `${product.name} · ${siteConfig.name}`,
      description,
      images: [{ url: product.image.src, width: product.image.width, height: product.image.height }],
    },
  };
}

// El marco (encabezado) es igual para todos; lo que depende de la URL va dentro
// de <Suspense>, como pide Next para que la navegación sea instantánea.
export default function ProductPage({ params }: PageProps) {
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
      <Suspense fallback={<div className="min-h-svh" />}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: PageProps) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const { nav, catalog, contact, locale } = siteConfig;
  const related = products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-[1300px] px-5 pt-24 pb-28 lg:px-10 lg:pt-32">
      <Link
        href={nav.catalogHref}
        className="text-sm font-medium tracking-[0.12em] text-ink-soft uppercase hover:text-ink"
      >
        ← {catalog.backToCatalog}
      </Link>

      <ProductDetail
        product={product}
        price={formatPrice(product.price, locale)}
        compareAtPrice={
          product.compareAtPrice ? formatPrice(product.compareAtPrice, locale) : undefined
        }
        whatsapp={contact.whatsapp}
        labels={{
          tags: catalog.tags,
          colorLabel: catalog.colorLabel,
          addFavorite: catalog.favorites.add,
          removeFavorite: catalog.favorites.remove,
          sizeLabel: catalog.sizeLabel,
          pickSize: catalog.pickSize,
          soldOut: catalog.soldOut,
          cta: catalog.cta,
          whatsappMessage: catalog.whatsappMessage,
          share: catalog.share,
          shared: catalog.shared,
        }}
      >
        {catalog.paymentNote ? (
          <p className="mt-6 text-sm font-medium text-ink">{catalog.paymentNote}</p>
        ) : null}
        <ol className="mt-8 space-y-2 border-t border-mint pt-6 text-sm text-ink-soft">
          {catalog.howToBuy.map((step, i) => (
            <li key={step.title}>
              <span className="font-semibold text-ink">
                {i + 1}. {step.title}.
              </span>{" "}
              {step.body}
            </li>
          ))}
        </ol>
      </ProductDetail>

      <h2 className="mt-20 font-display text-4xl text-ink lg:text-5xl">{catalog.related}</h2>
      <ul className="mt-6 grid grid-cols-3 gap-3 lg:gap-8">
        {related.map((item) => (
          <li key={item.id}>
            <Link href={`/producto/${item.id}`} className="group block">
              <span className="product-tile relative block aspect-[4/3] overflow-hidden rounded-2xl lg:rounded-3xl">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="30vw"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-105 lg:p-7"
                />
              </span>
              <span className="mt-2 block truncate text-sm text-ink lg:font-display lg:text-2xl">
                {item.name}
              </span>
              <span className="block text-sm font-semibold text-ink lg:text-base">
                {formatPrice(item.price, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
