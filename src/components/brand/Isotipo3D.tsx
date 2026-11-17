"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { ISOTIPO_FULL, ISOTIPO_LENS, ISOTIPO_VIEWBOX, type IsotipoHandle } from "./isotipo-paths";

type Props = {
  ref?: Ref<IsotipoHandle>;
  /**
   * El lienzo cubre toda la pantalla (para que al atravesar el logo nada se
   * corte) y se ubica centrado sobre la caja del isotipo, que es su padre.
   */
  className?: string;
  /** Se llama cuando ya hay un cuadro dibujado (para ocultar el SVG de respaldo). */
  onReady?: () => void;
};

const FOV = 26;
/**
 * Profundidad de la extrusión (unidades del viewBox). Los trazos del isotipo
 * miden ~2 a 9 de ancho: con más profundidad, de costado parece un cortante de
 * galletitas (cintas con aire en el medio). Así se ve como una pieza de metal maciza.
 */
const DEPTH = 4.5;

const cssColor = (name: string) =>
  new Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * Isotipo extruido en metal. Solo se descarga en escritorio (ver IsotipoMark).
 * Al scrollear, la cámara se pone de frente y avanza hasta pasar por el óvalo
 * del medio: se "atraviesa" el logo para llegar a los zapatos.
 */
export default function Isotipo3D({ ref, className, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useImperativeHandle(ref, () => ({
    setSplit(value) {
      progress.current = clamp01(value);
    },
  }));

  useEffect(() => {
    const el = host.current;
    const box = el?.parentElement;
    if (!el || !box) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // sin WebGL: queda el SVG
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

    const scene = new Scene();
    // Un "estudio" generado por código: es lo que el metal refleja. No baja ninguna imagen.
    const pmrem = new PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;

    const camera = new PerspectiveCamera(FOV, 1, 0.5, 4000);

    const key = new DirectionalLight(cssColor("--brand-paper"), 2.2);
    key.position.set(160, 220, 300);
    scene.add(key);

    const material = new MeshPhysicalMaterial({
      // El dorado de marca (champán), con un poco más de saturación para que el
      // reflejo del estudio no lo lave a plateado.
      color: cssColor("--brand-gold").offsetHSL(0, 0.08, -0.04),
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 0.55,
    });

    // El mismo trazo que usa el SVG, extruido en una sola pieza.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${ISOTIPO_FULL}" fill-rule="evenodd"/></svg>`;
    const shapes = new SVGLoader().parse(svg).paths.flatMap((path) => path.toShapes());
    const geometry = new ExtrudeGeometry(shapes, {
      depth: DEPTH,
      bevelEnabled: true,
      // Bisel chico: los trazos finos miden ~2 unidades, y uno más grande se
      // cruza consigo mismo y deja "pelitos" en los bordes.
      bevelThickness: 1.6,
      bevelSize: 0.5,
      bevelSegments: 4,
      // El trazo vectorizado ya trae muchas curvas cortas: con pocos segmentos alcanza.
      curveSegments: 6,
    });
    // Centrado en el viewBox y con el espesor repartido adelante y atrás.
    geometry.translate(-ISOTIPO_VIEWBOX.width / 2, -ISOTIPO_VIEWBOX.height / 2, -DEPTH / 2);
    const mesh = new Mesh(geometry, material);
    // SVG tiene la Y hacia abajo. Se da vuelta con la escala del objeto (no de la
    // geometría): así Three.js corrige el orden de las caras y el metal se ve
    // macizo. Dar vuelta la geometría dejaba las caras al revés y se veía hueco.
    mesh.scale.y = -1;
    const root = new Group();
    root.add(mesh);
    scene.add(root);

    // El óvalo del medio, en coordenadas de la escena (Y hacia arriba).
    const lensX = ISOTIPO_LENS.x - ISOTIPO_VIEWBOX.width / 2;
    const lensY = -(ISOTIPO_LENS.y - ISOTIPO_VIEWBOX.height / 2);

    // Distancia de cámara para que el isotipo mida en pantalla lo mismo que su caja.
    let restZ = 400;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      const boxHeight = box.clientHeight;
      if (!w || !h || !boxHeight) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const visibleHeight = ISOTIPO_VIEWBOX.height * (h / boxHeight);
      restZ = visibleHeight / 2 / Math.tan((FOV * Math.PI) / 360);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    observer.observe(box);
    resize();

    let frame = 0;
    let announced = false;
    let cleared = false;
    const start = performance.now();
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (document.hidden) return;
      const v = progress.current;
      if (v >= 1) {
        // Ya se atravesó: se limpia una vez y se deja de dibujar.
        if (!cleared) renderer.clear();
        cleared = true;
        return;
      }
      cleared = false;
      const t = (now - start) / 1000;

      // En reposo se mece para que corran los reflejos; al empezar a scrollear
      // se pone de frente (en el primer 30 %).
      const calm = 1 - smooth(clamp01(v / 0.3));
      // Giro moderado: alcanza para que el reflejo recorra el metal sin mostrar
      // demasiado el canto.
      root.rotation.y = Math.sin(t * 0.7) * 0.38 * calm;
      root.rotation.x = Math.sin(t * 0.45) * 0.12 * calm;

      // La cámara apunta al óvalo y avanza: lento al principio, cada vez más
      // rápido, hasta quedar del otro lado del logo.
      const aim = smooth(clamp01(v / 0.45));
      const travel = clamp01((v - 0.08) / 0.92);
      const push = travel ** 2.4;
      camera.position.set(lensX * aim, lensY * aim, restZ + (-DEPTH * 3 - restZ) * push);
      // Un leve giro sobre el eje de la mirada mientras avanza.
      camera.rotation.z = push * 0.35;

      renderer.render(scene, camera);
      if (!announced) {
        announced = true;
        onReady?.();
      }
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={host} className={className} aria-hidden="true" />;
}
