import { Archivo, Cormorant_Garamond } from "next/font/google";

// Tipografías de la identidad. next/font las descarga en el build y las sirve
// desde el propio sitio (sin pedidos a Google en el celular del visitante).
export const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display-face",
});

export const ui = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui-face",
});
