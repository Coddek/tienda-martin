"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { ISOTIPO_SHAPES, ISOTIPO_VIEWBOX, type IsotipoHandle } from "./isotipo-paths";

type Props = {
  ref?: Ref<IsotipoHandle>;
  className?: string;
  /**
   * Alto del lienzo en "alturas de isotipo". El lienzo es más grande que el
   * isotipo para que las piezas puedan salir hacia los costados sin cortarse.
   */
  heightRatio: number;
  /** Se llama cuando ya hay un cuadro dibujado (para ocultar el SVG de respaldo). */
  onReady?: () => void;
};

const FOV = 26;

const cssColor = (name: string) =>
  new Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Isotipo extruido en metal. Solo se descarga en escritorio (ver IsotipoMark). */
export default function Isotipo3D({ ref, className, heightRatio, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const split = useRef(0);

  useImperativeHandle(ref, () => ({
    setSplit(value) {
      split.current = Math.min(1, Math.max(0, value));
    },
  }));

  useEffect(() => {
    const el = host.current;
    if (!el) return;

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

    const visibleHeight = ISOTIPO_VIEWBOX.height * heightRatio;
    const camera = new PerspectiveCamera(FOV, 1, 1, 4000);
    camera.position.z = visibleHeight / 2 / Math.tan((FOV * Math.PI) / 360);

    const key = new DirectionalLight(cssColor("--brand-paper"), 2.2);
    key.position.set(160, 220, 300);
    scene.add(key);

    const material = new MeshPhysicalMaterial({
      // El estudio claro lava el metal a plateado: se corre el color de marca hacia un
      // amarillo más saturado y se baja la intensidad del reflejo.
      color: cssColor("--brand-gold").offsetHSL(0.02, 0.35, 0),
      metalness: 1,
      roughness: 0.28,
      envMapIntensity: 0.5,
    });

    // Los mismos trazos que usa el SVG, extruidos.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${Object.values(ISOTIPO_SHAPES)
      .map((d) => `<path d="${d}" fill-rule="evenodd"/>`)
      .join("")}</svg>`;
    const root = new Group();
    const pieces: Group[] = [];
    const geometries: ExtrudeGeometry[] = [];
    for (const path of new SVGLoader().parse(svg).paths) {
      const geometry = new ExtrudeGeometry(path.toShapes(), {
        depth: 13,
        bevelEnabled: true,
        bevelThickness: 2.4,
        bevelSize: 1.6,
        bevelSegments: 6,
        curveSegments: 32,
      });
      // SVG tiene la Y hacia abajo: se da vuelta y se centra en el viewBox.
      geometry.scale(1, -1, 1);
      geometry.translate(-ISOTIPO_VIEWBOX.width / 2, ISOTIPO_VIEWBOX.height / 2, -6.5);
      // Cada pieza gira sobre su propio centro.
      geometry.computeBoundingBox();
      const center = (geometry.boundingBox ?? new Box3()).getCenter(new Vector3());
      geometry.translate(-center.x, -center.y, -center.z);
      const pivot = new Group();
      pivot.position.copy(center);
      pivot.userData.home = center.clone();
      pivot.add(new Mesh(geometry, material));
      root.add(pivot);
      pieces.push(pivot);
      geometries.push(geometry);
    }
    scene.add(root);

    let halfWidth = visibleHeight;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      halfWidth = (visibleHeight * camera.aspect) / 2;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    let frame = 0;
    let announced = false;
    let cleared = false;
    const start = performance.now();
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (document.hidden) return;
      const v = split.current;
      if (v >= 1) {
        // Ya salió de pantalla: se limpia una vez y se deja de dibujar.
        if (!cleared) renderer.clear();
        cleared = true;
        return;
      }
      cleared = false;
      const t = (now - start) / 1000;
      // En reposo se mece para que corran los reflejos; al abrirse queda de frente.
      const calm = 1 - smooth(Math.min(1, v * 4));
      root.rotation.y = Math.sin(t * 0.7) * 0.6 * calm;
      root.rotation.x = Math.sin(t * 0.45) * 0.14 * calm;
      // Puerta: cada hoja se corre a su costado y gira hacia afuera, sin transparencias.
      const open = smooth(v);
      const exit = halfWidth + ISOTIPO_VIEWBOX.width * 0.4;
      pieces.forEach((piece, i) => {
        const side = i === 0 ? -1 : 1;
        const home = piece.userData.home as Vector3;
        piece.position.x = home.x + side * open * exit;
        piece.rotation.y = side * (-0.22 * calm + open * 0.85);
      });
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
      geometries.forEach((g) => g.dispose());
      material.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [heightRatio, onReady]);

  return <div ref={host} className={className} aria-hidden="true" />;
}
