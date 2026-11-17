"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Los filtros del catálogo viven en la URL (?cat=Sandalias&talle=37&orden=menor):
 * se pueden compartir, y al volver desde un producto aparecen como estaban.
 * Además se recuerda la última URL del catálogo para el enlace "Volver".
 */
export type CatalogQuery = { cat: string | null; talle: number | null; orden: string | null };

/** Valor de `cat` que muestra solo los favoritos. */
export const FAVORITES_FILTER = "favoritos";

const EVENT = "catalogo:url";
const BACK_KEY = "catalogo:volver";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useCatalogQuery() {
  // En el servidor no hay URL de la persona: se arma con los filtros por defecto.
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");

  const query = useMemo<CatalogQuery>(() => {
    const params = new URLSearchParams(search);
    const talle = Number(params.get("talle"));
    return {
      cat: params.get("cat"),
      talle: Number.isInteger(talle) && talle > 0 ? talle : null,
      orden: params.get("orden"),
    };
  }, [search]);

  const setQuery = useCallback((patch: Partial<CatalogQuery>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, String(value));
    }
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    // replaceState: cambiar un filtro no suma pasos al botón "atrás" del teléfono.
    window.history.replaceState(window.history.state, "", url);
    rememberCatalogUrl();
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { query, setQuery };
}

/** Guarda dónde estaba el catálogo (página y filtros) para el enlace "Volver". */
export function rememberCatalogUrl() {
  try {
    sessionStorage.setItem(BACK_KEY, `${window.location.pathname}${window.location.search}`);
  } catch {
    // sin almacenamiento: "Volver" usa el catálogo por defecto
  }
}

export function readCatalogUrl(): string | null {
  try {
    return sessionStorage.getItem(BACK_KEY);
  } catch {
    return null;
  }
}
