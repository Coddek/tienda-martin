import type { Metadata, Viewport } from "next";
import { siteConfig } from "../../site.config";
import { themeVars } from "@/lib/theme";
import { display, ui } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.name} · ${siteConfig.hero.eyebrow}`,
  description: siteConfig.description,
  robots: siteConfig.preview ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: siteConfig.colors.ink,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={siteConfig.locale}
      className={`${display.variable} ${ui.variable} antialiased`}
      style={themeVars(siteConfig.colors)}
    >
      <body>{children}</body>
    </html>
  );
}
