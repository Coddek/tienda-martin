"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { readCatalogUrl } from "@/lib/catalogQuery";

type Props = {
  /** Adónde ir si no se sabe de dónde vino la persona (llegó directo al producto). */
  fallbackHref: string;
  /** Ancla del catálogo dentro de la portada. */
  homeAnchor: string;
  label: string;
  className?: string;
};

const noSubscribe = () => () => {};

/** "Volver al catálogo": regresa a la página y los filtros desde donde se abrió el producto. */
export function BackToCatalog({ fallbackHref, homeAnchor, label, className }: Props) {
  const saved = useSyncExternalStore(noSubscribe, readCatalogUrl, () => null);
  // El catálogo de la portada está más abajo: se agrega el ancla para caer en él.
  const href = !saved
    ? fallbackHref
    : saved === "/" || saved.startsWith("/?")
      ? `${saved}#${homeAnchor}`
      : saved;

  return (
    <Link href={href} className={className}>
      ← {label}
    </Link>
  );
}
