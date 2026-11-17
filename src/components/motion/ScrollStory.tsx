"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";
import type { IsotipoHandle } from "@/components/brand/isotipo-paths";
import { MEDIA, useMediaQuery } from "@/lib/useMediaQuery";
import { Stage } from "./Stage";

type Props = {
  children: ReactNode;
};

/**
 * Toda la animación de la portada vive acá. Las secciones (children) solo traen
 * contenido y marcas `data-*`:
 *   [data-hero] / [data-hero-fade]   portada y lo que se desvanece al scrollear
 *   [data-chapter]                   sección con título animado
 *   [data-char]                      letras de los títulos (SplitTitle)
 *   [data-reveal]                    textos que entran con fundido
 *   [data-runway-track] / -card      pasarela de destacados
 *   [data-closing]                   sección clara (catálogo): el encabezado se vuelve sólido
 * Con `prefers-reduced-motion` no se arma nada y la página queda estática.
 */
export function ScrollStory({ children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const isotipo = useRef<IsotipoHandle>(null);

  const motionOk = useMediaQuery(MEDIA.motionOk);
  const desktop = useMediaQuery(MEDIA.desktop);

  useEffect(() => {
    const el = root.current;
    if (!el || !motionOk) return;

    gsap.registerPlugin(ScrollTrigger);
    // En celular la barra del navegador aparece y desaparece al scrollear: eso no
    // debe recalcular (y hacer saltar) toda la animación.
    ScrollTrigger.config({ ignoreMobileResize: true });
    // Si el teléfono va lento, las animaciones saltan a donde deberían estar en vez
    // de atrasarse: nunca queda contenido a medio aparecer.
    gsap.ticker.lagSmoothing(0);
    let cancelled = false;
    let stopLenis: (() => void) | undefined;
    // El isotipo expone un método (no es un nodo): se lee al momento de usarlo.
    const setSplit = (value: number) => isotipo.current?.setSplit(value);

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const hero = q("[data-hero]")[0];
      const closing = q("[data-closing]")[0];
      const header = document.querySelector("[data-site-header]");

      if (hero) {
        // El título entra letra por letra al cargar.
        // (fromTo con destino explícito: si el efecto se rearma, las letras nunca quedan escondidas)
        gsap.fromTo(
          hero.querySelectorAll("[data-char]"),
          { yPercent: 115 },
          { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.07, delay: 0.15 },
        );

        // Al scrollear: el isotipo se abre como una puerta mientras sube la pasarela.
        const state = { split: 0 };
        gsap
          .timeline({
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: () => `+=${window.innerHeight * 0.7}`,
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          })
          .to(
            hero.querySelectorAll("[data-hero-fade]"),
            { autoAlpha: 0, y: -40, duration: 0.35, ease: "none" },
            0,
          )
          .to(state, { split: 1, duration: 1, ease: "none", onUpdate: () => setSplit(state.split) }, 0);
      }

      q("[data-chapter]").forEach((chapter) => {
        // Título letra por letra y textos con fundido al entrar la sección.
        const chars = chapter.querySelectorAll("[data-char]");
        const reveals = chapter.querySelectorAll("[data-reveal]");
        const cards = chapter.querySelectorAll("[data-runway-card]");
        const track = chapter.querySelector("[data-runway-track]");
        gsap.set(chars, { yPercent: 115 });
        gsap.set(reveals, { autoAlpha: 0, y: 24 });
        gsap.set(cards, { autoAlpha: 0, y: 70 });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: chapter,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          })
          .to(chars, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.03 }, 0)
          .to(reveals, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.12 }, 0.1)
          // Los zapatos entran de a uno, como caminando.
          .to(cards, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }, 0.2);

        // La fila entera se corre un poco con el scroll: se nota que sigue hacia el costado.
        if (track) {
          gsap.fromTo(
            track,
            { x: () => window.innerWidth * 0.14 },
            {
              x: 0,
              ease: "none",
              scrollTrigger: {
                trigger: chapter,
                start: "top bottom",
                end: "top 25%",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });

      // Mientras el catálogo (fondo claro) pasa por debajo del encabezado, este se vuelve sólido.
      if (closing && header) {
        ScrollTrigger.create({
          trigger: closing,
          start: "top 64px",
          end: "bottom 64px",
          onToggle: (self) => header.toggleAttribute("data-solid", self.isActive),
        });
      }
    }, el);

    // Las tipografías cambian las alturas: recalcular cuando terminan de cargar.
    document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    // Scroll suave solo en escritorio; en celular queda el scroll nativo.
    if (desktop) {
      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        const lenis = new Lenis({ anchors: true });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        stopLenis = () => {
          gsap.ticker.remove(tick);
          lenis.destroy();
        };
      });
    }

    return () => {
      cancelled = true;
      stopLenis?.();
      ctx.revert();
      document.querySelector("[data-site-header]")?.removeAttribute("data-solid");
      setSplit(0);
    };
  }, [motionOk, desktop]);

  return (
    <div ref={root} className="relative">
      <Stage use3D={motionOk && desktop} isotipoRef={isotipo} />
      <div className="relative z-10">{children}</div>
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-20" />
    </div>
  );
}
