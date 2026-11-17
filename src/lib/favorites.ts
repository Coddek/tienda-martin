"use client";

import { useSyncExternalStore } from "react";

/**
 * Favoritos guardados en el teléfono de la persona (localStorage): no hace falta
 * cuenta ni servidor. Cada favorito recuerda el talle y el color elegidos, para
 * armar una sola consulta de WhatsApp con todo.
 */
export type Favorite = { id: string; size: number | null; color: string | null };

const KEY = "favoritos";
const EVENT = "favoritos:cambio";
const EMPTY: Favorite[] = [];

let cachedRaw: string | null = null;
let cached: Favorite[] = EMPTY;

function read(): Favorite[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY; // navegación privada o almacenamiento bloqueado
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cached = Array.isArray(parsed) ? (parsed as Favorite[]) : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function save(next: Favorite[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // sin almacenamiento: los favoritos no se guardan, el resto funciona igual
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useFavorites(): Favorite[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function toggleFavorite(favorite: Favorite) {
  const current = read();
  save(
    current.some((f) => f.id === favorite.id)
      ? current.filter((f) => f.id !== favorite.id)
      : [...current, favorite],
  );
}

/** Si el modelo ya es favorito, actualiza el talle o el color elegidos. */
export function updateFavorite(id: string, patch: Partial<Omit<Favorite, "id">>) {
  const current = read();
  if (!current.some((f) => f.id === id)) return;
  save(current.map((f) => (f.id === id ? { ...f, ...patch } : f)));
}
