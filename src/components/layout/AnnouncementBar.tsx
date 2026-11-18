"use client";

import { useEffect, useRef } from "react";

/**
 * Cartel de arriba (se prende desde el editor). Publica su alto en
 * --announce-h para que la portada y las páginas bajen lo justo y el
 * encabezado no tape nada, aunque el texto ocupe dos líneas en el celular.
 * Antes de que cargue JS, globals.css ya reserva una línea.
 */
export function AnnouncementBar({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--announce-h", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--announce-h");
    };
  }, []);

  return (
    <p
      ref={ref}
      data-announcement
      className="bg-gold px-5 py-2 text-center text-xs leading-snug font-semibold tracking-[0.08em] text-ink uppercase lg:text-sm"
    >
      {text}
    </p>
  );
}
