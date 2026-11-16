"use client";

import dynamic from "next/dynamic";
import { useCallback, useImperativeHandle, useRef, useState, type Ref } from "react";
import { IsotipoSvg } from "./IsotipoSvg";
import type { IsotipoHandle } from "./isotipo-paths";

// Three.js va en un paquete aparte que el celular nunca descarga.
const Isotipo3D = dynamic(() => import("./Isotipo3D"), { ssr: false });

/** El lienzo 3D mide esto por el alto del isotipo (y todo el ancho de pantalla). */
const CANVAS_HEIGHT_RATIO = 2;

type Props = {
  ref?: Ref<IsotipoHandle>;
  /** Usar la versión 3D (escritorio, con movimiento permitido). */
  use3D: boolean;
  className?: string;
};

/** Elige la versión del isotipo: SVG siempre, y 3D encima cuando corresponde. */
export function IsotipoMark({ ref, use3D, className }: Props) {
  const svg = useRef<IsotipoHandle>(null);
  const three = useRef<IsotipoHandle>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useImperativeHandle(ref, () => ({
    setSplit(value) {
      svg.current?.setSplit(value);
      three.current?.setSplit(value);
    },
  }));

  const show3D = use3D && ready;
  return (
    <div className={`relative ${className ?? ""}`}>
      <IsotipoSvg
        ref={svg}
        className={`h-full w-full ${show3D ? "invisible" : ""}`}
      />
      {use3D && (
        <Isotipo3D
          ref={three}
          onReady={onReady}
          heightRatio={CANVAS_HEIGHT_RATIO}
          className={`absolute top-1/2 left-1/2 h-[200%] w-screen -translate-x-1/2 -translate-y-1/2 ${ready ? "" : "invisible"}`}
        />
      )}
    </div>
  );
}
