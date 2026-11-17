import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { siteConfig } from "../../site.config";
import { FavoritesBar } from "@/components/catalog/FavoritesBar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { getCatalog } from "@/lib/catalog";
import { themeVars } from "@/lib/theme";
import { whatsappLink } from "@/lib/whatsapp";
import { display, ui } from "./fonts";
import "./globals.css";

// Dirección pública del sitio: la usan las vistas previas al compartir un enlace.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteConfig.name} · ${siteConfig.hero.eyebrow}`,
  description: siteConfig.description,
  robots: siteConfig.preview ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: siteConfig.colors.ink,
};

/**
 * La barra de favoritos necesita los nombres del catálogo. Va aparte y dentro
 * de <Suspense> (abajo): así el layout no espera a Supabase y ninguna página
 * queda bloqueada si la consulta tarda (por ejemplo, con la caché vacía).
 */
async function FavoritesBarWithCatalog() {
  const products = (await getCatalog()).map(({ id, name, ref, image, variants }) => ({
    id,
    name,
    ref,
    photo: image.src,
    photos: Object.fromEntries(variants.map((v) => [v.color, v.image.src])),
  }));
  return (
    <FavoritesBar
      products={products}
      whatsapp={siteConfig.contact.whatsapp}
      labels={siteConfig.catalog.favorites}
      sizeLabel={siteConfig.catalog.sizeLabel}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={siteConfig.locale}
      className={`${display.variable} ${ui.variable} antialiased`}
      style={themeVars(siteConfig.colors)}
    >
      <body>
        {children}
        <Suspense fallback={null}>
          <FavoritesBarWithCatalog />
        </Suspense>
        <WhatsAppFab
          label={siteConfig.whatsappFab.label}
          href={whatsappLink(siteConfig.contact.whatsapp, siteConfig.whatsappFab.message, {})}
        />
      </body>
    </html>
  );
}
