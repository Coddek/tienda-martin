"use client";

import { useSyncExternalStore } from "react";

type Props = {
  label: string;
  href: string;
};

/** Cuántos píxeles hay que bajar para que aparezca (deja limpia la portada). */
const SHOW_AFTER = 320;

const subscribe = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};

/** Botón flotante para escribir por WhatsApp, siempre a mano una vez que se empieza a bajar. */
export function WhatsAppFab({ label, href }: Props) {
  const visible = useSyncExternalStore(
    subscribe,
    () => window.scrollY > SHOW_AFTER,
    () => false,
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rust text-paper shadow-lg transition-all duration-300 lg:right-8 lg:bottom-8 lg:h-16 lg:w-16 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 lg:h-8 lg:w-8" fill="none" aria-hidden="true">
        <path
          d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 8.6c-.3 1 .2 2.5 1.6 3.9 1.4 1.4 2.9 1.9 3.9 1.6.5-.2.9-.7 1-1.2l-1.6-.9-.8.7c-.6-.2-1.5-1.100-1.800-1.800l.7-.8-.9-1.600c-.5.1-1 .5-1.200 1.100Z"
          fill="currentColor"
        />
      </svg>
    </a>
  );
}
