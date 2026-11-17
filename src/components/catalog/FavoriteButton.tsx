"use client";

import { toggleFavorite, useFavorites } from "@/lib/favorites";

type Props = {
  id: string;
  size: number | null;
  color: string | null;
  addLabel: string;
  removeLabel: string;
  className?: string;
};

/** Corazón para guardar un modelo en favoritos. */
export function FavoriteButton({ id, size, color, addLabel, removeLabel, className }: Props) {
  const active = useFavorites().some((f) => f.id === id);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? removeLabel : addLabel}
      title={active ? removeLabel : addLabel}
      onClick={() => toggleFavorite({ id, size, color })}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-paper text-rust shadow-sm transition-transform active:scale-90 ${className ?? ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.500-6.500l.9.9.9-.9a4.6 4.6 0 0 1 6.500 6.500L12 20.3Z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
