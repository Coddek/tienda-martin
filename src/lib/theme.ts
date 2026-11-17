import type { CSSProperties } from "react";
import type { SiteConfig } from "../../site.config";

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Nombre de la variable CSS de un color de marca: "inkSoft" → "--brand-ink-soft". */
export const brandVar = (name: string) => `--brand-${kebab(name)}`;

/**
 * Convierte los colores de la configuración en variables CSS (`--brand-ink`, …).
 * `globals.css` las expone a Tailwind como `bg-ink`, `text-paper`, etc.
 */
export function themeVars(colors: SiteConfig["colors"]): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(colors)) {
    vars[brandVar(name)] = value;
  }
  return vars as CSSProperties;
}
