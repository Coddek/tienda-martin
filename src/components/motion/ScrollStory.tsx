"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";
import type { IsotipoHandle } from "@/components/brand/isotipo-paths";
import { MEDIA, useMediaQuery } from "@/lib/useMediaQuery";
import type { ShoeImage } from "../../../site.config";
import { Stage } from "./Stage";

type Props = {
  shoes: readonly ShoeImage[];
  children: ReactNode;
};

type Slot = { x: number; y: number; rotation: number; scale: number };

/**
 * Toda la animación de la página vive acá. Las secciones (children) solo traen
 * contenido y marcas `data-*`:
 *   [data-hero] / [data-hero-fade]   portada y lo que se desvanece al scrollear
 *   [data-chapter][data-text-side]   cada capítulo y de qué lado va su texto
 *   [data-chapter-text]              bloque de texto del capítulo
 *   [data-char]                      letras de los títulos (SplitTitle)
 *   [data-reveal]                    textos que entran con fundido
 *   [data-closing]                   cierre: el zapato se va
 * Las alturas de scroll las define cada sección (Hero y Chapter); acá solo se
 * engancha a ellas. Con `prefers-reduced-motion` no se arma nada.
 */
export function ScrollStory({ shoes, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const isotipo = useRef<IsotipoHandle>(null);
  const shoe = useRef<HTMLDivElement>(null);

  const motionOk = useMediaQuery(MEDIA.motionOk);
  const desktop = useMediaQuery(MEDIA.desktop);

  useEffect(() => {
    const el = root.current;
    const shoeEl = shoe.current;
    if (!el || !shoeEl || !motionOk) return;

    gsap.registerPlugin(ScrollTrigger);
    let cancelled = false;
    let stopLenis: (() => void) | undefined;
    // El isotipo expone un método (no es un nodo): se lee al momento de usarlo.
    const setSplit = (value: number) => isotipo.current?.setSplit(value);

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const hero = q("[data-hero]")[0];
      const chapters = q("[data-chapter]");
      const closing = q("[data-closing]")[0];
      const shoeImages = q("[data-shoe]");
      const tilt = q("[data-shoe-tilt]")[0];
      const glow = q("[data-shoe-glow]")[0];
      const shadow = q("[data-shoe-shadow]")[0];
      const isotipoBox = q("[data-isotipo]")[0];

      // Dónde se para el zapato al llegar a cada capítulo, lejos del texto.
      const slot = (index: number): Slot => {
        if (index < 0) return { x: 0, y: 0, rotation: 0, scale: 1 };
        const textSide = chapters[index].dataset.textSide;
        const grow = index % 2 ? 1.12 : 1.04;
        if (desktop) {
          const side = textSide === "left" ? 1 : -1;
          return { x: side * window.innerWidth * 0.235, y: 0, rotation: side * -9, scale: grow };
        }
        return { x: 0, y: -window.innerHeight * 0.2, rotation: index % 2 ? 7 : -7, scale: grow };
      };
      // Mientras el capítulo está fijo el zapato sigue girando y creciendo un poco.
      const slotEnd = (index: number): Slot => {
        const s = slot(index);
        if (index < 0) return s;
        return { ...s, rotation: s.rotation + Math.sign(s.rotation) * -6, scale: s.scale + 0.06 };
      };
      // El zapato nace donde está el isotipo.
      const birthY = () => {
        const box = isotipoBox.getBoundingClientRect();
        return box.top + box.height / 2 - window.innerHeight / 2;
      };

      gsap.set(shoeEl, { xPercent: -50, yPercent: -50, x: 0, y: 0, autoAlpha: 0 });
      gsap.set([glow, shadow], { autoAlpha: 0 });
      gsap.set(shoeImages.slice(1), { autoAlpha: 0 });
      gsap.to(q("[data-shoe-float]"), {
        y: -12,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      if (hero) {
        // El título entra letra por letra al cargar.
        gsap.from(hero.querySelectorAll("[data-char]"), {
          yPercent: 115,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.07,
          delay: 0.15,
        });

        // Al scrollear: el isotipo se abre como una puerta y el zapato sale
        // nítido entre las dos hojas (sin transparencias cruzadas).
        const state = { split: 0 };
        gsap
          .timeline({
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: () => `+=${window.innerHeight * 0.6}`,
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          })
          .to(
            hero.querySelectorAll("[data-hero-fade]"),
            { autoAlpha: 0, y: -40, duration: 0.3, ease: "none" },
            0,
          )
          .to(
            state,
            { split: 1, duration: 0.85, ease: "none", onUpdate: () => setSplit(state.split) },
            0,
          )
          .set(shoeEl, { autoAlpha: 1 }, 0.22)
          .fromTo(
            shoeEl,
            { scale: 0.18, y: birthY },
            { scale: 1, y: 0, duration: 0.78, ease: "power2.out", immediateRender: false },
            0.22,
          )
          .fromTo(
            tilt,
            { rotation: -18 },
            { rotation: 0, duration: 0.78, ease: "power2.out", immediateRender: false },
            0.22,
          )
          .fromTo(
            [glow, shadow],
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4, ease: "none", immediateRender: false },
            0.6,
          );
      }

      chapters.forEach((chapter, i) => {
        // El zapato viaja a su lugar mientras entra el capítulo…
        const travel = gsap.timeline({
          scrollTrigger: {
            trigger: chapter,
            start: "top bottom",
            end: "top top",
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });
        travel
          .fromTo(
            shoeEl,
            { x: () => slotEnd(i - 1).x, y: () => slotEnd(i - 1).y, scale: () => slotEnd(i - 1).scale },
            {
              x: () => slot(i).x,
              y: () => slot(i).y,
              scale: () => slot(i).scale,
              duration: 1,
              ease: "power2.inOut",
              immediateRender: false,
            },
            0,
          )
          .fromTo(
            tilt,
            { rotation: () => slotEnd(i - 1).rotation },
            { rotation: () => slot(i).rotation, duration: 1, ease: "power1.inOut", immediateRender: false },
            0,
          )
          // …el halo y la sombra lo siguen a otro ritmo (parallax)…
          .fromTo(
            glow,
            { x: () => slot(i - 1).x * -0.22, y: () => slot(i - 1).y * -0.22 },
            {
              x: () => slot(i).x * -0.22,
              y: () => slot(i).y * -0.22,
              duration: 1,
              ease: "power3.out",
              immediateRender: false,
            },
            0,
          )
          .fromTo(
            shadow,
            { x: () => slot(i - 1).x * 0.06 },
            { x: () => slot(i).x * 0.06, duration: 1, ease: "power1.in", immediateRender: false },
            0,
          );
        // …y cambia de modelo con fundido.
        if (i > 0 && shoeImages[i]) {
          travel
            .fromTo(
              shoeImages[i - 1],
              { autoAlpha: 1 },
              { autoAlpha: 0, duration: 0.3, ease: "none", immediateRender: false },
              0.35,
            )
            .fromTo(
              shoeImages[i],
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.3, ease: "none", immediateRender: false },
              0.35,
            );
        }

        // Tramo fijo del capítulo: el zapato no se queda quieto.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: chapter,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            tilt,
            { rotation: () => slot(i).rotation },
            { rotation: () => slotEnd(i).rotation, ease: "none", immediateRender: false },
            0,
          )
          .fromTo(
            shoeEl,
            { scale: () => slot(i).scale },
            { scale: () => slotEnd(i).scale, ease: "none", immediateRender: false },
            0,
          )
          .fromTo(glow, { scale: 1 }, { scale: 1.18, ease: "none", immediateRender: false }, 0);

        // Texto: letra por letra mientras el capítulo sube a su lugar.
        const chars = chapter.querySelectorAll("[data-char]");
        const reveals = chapter.querySelectorAll("[data-reveal]");
        gsap.set(chars, { yPercent: 115 });
        gsap.set(reveals, { autoAlpha: 0, y: 24 });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: chapter,
              start: "top 45%",
              toggleActions: "play none none reverse",
            },
          })
          .to(chars, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.03 }, 0)
          .to(reveals, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.12 }, 0.1);

        // El texto se va antes de soltarse, así no cruza la zona del zapato.
        gsap.fromTo(
          chapter.querySelectorAll("[data-chapter-text]"),
          { autoAlpha: 1, y: 0 },
          {
            autoAlpha: 0,
            y: -30,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: chapter,
              start: "bottom 128%",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
      });

      if (closing) {
        gsap.fromTo(
          shoeEl,
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: closing, start: "top 90%", end: "top 45%", scrub: true },
          },
        );
      }

      // Escritorio: el zapato acompaña apenas al puntero.
      if (desktop) {
        const moveX = gsap.quickTo(tilt, "x", { duration: 0.9, ease: "power3.out" });
        const moveY = gsap.quickTo(tilt, "y", { duration: 0.9, ease: "power3.out" });
        const onPointer = (event: PointerEvent) => {
          moveX((event.clientX / window.innerWidth - 0.5) * 34);
          moveY((event.clientY / window.innerHeight - 0.5) * 22);
        };
        window.addEventListener("pointermove", onPointer, { passive: true });
        return () => window.removeEventListener("pointermove", onPointer);
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
        const lenis = new Lenis();
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
      setSplit(0);
    };
  }, [motionOk, desktop]);

  return (
    <div ref={root} className="relative">
      <Stage shoes={shoes} use3D={motionOk && desktop} isotipoRef={isotipo} shoeRef={shoe} />
      <div className="relative z-10">{children}</div>
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-20" />
    </div>
  );
}
