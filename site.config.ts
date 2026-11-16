/**
 * Identidad y contenido del sitio. Para usar esta base en otro negocio se cambia
 * este archivo, `src/app/fonts.ts`, `src/components/brand/isotipo-paths.ts` y las
 * imágenes de `public/`. Ningún componente escribe colores ni textos a mano.
 */

export type ShoeImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Texto de la etiqueta cuando la foto no es definitiva. */
  placeholderLabel?: string;
};

export type ChapterContent = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  /** De qué lado va el texto en escritorio; el zapato va del otro. */
  textSide: "left" | "right";
  shoe: ShoeImage;
};

export const siteConfig = {
  name: "Martin",
  description:
    "Calzado femenino para todos los días. Sandalias, zapatos, botas y zapatillas urbanas.",
  locale: "es-AR",

  /** Mientras sea maqueta: no se indexa en buscadores y se muestran las etiquetas de provisorio. */
  preview: true,

  colors: {
    ink: "#123223",
    inkSoft: "#4C6558",
    paper: "#F0F1EB",
    mint: "#B9D0BB",
    mintSoft: "#D9EBDF",
    /** Acento metálico del isotipo (combina con el calzado). A confirmar con la identidad original. */
    gold: "#C8A662",
    /** Solo para llamados a la acción. */
    rust: "#A13D2C",
  },

  wordmark: {
    text: "MARTIN",
    /** El logo real usa una tipografía decorativa propia; esto es Cormorant hasta tener el archivo. */
    provisional: true,
    provisionalLabel: "Logotipo provisorio",
  },

  isotipo: {
    /** Redibujado a mano a partir de un PNG de 165×95; reemplazar por el original. */
    provisional: true,
  },

  contact: {
    /** Pendiente: número con código de país, sin signos. */
    whatsapp: "",
    instagram: "",
    address: "",
  },

  hero: {
    eyebrow: "Calzado femenino",
    tagline: "Elegante, para todos los días.",
    scrollHint: "Deslizá",
  },

  chapters: [
    {
      id: "bienvenida",
      number: "01",
      eyebrow: "Bienvenida",
      title: "Un paso adentro",
      body: "Somos un local de familia. Te ayudamos a elegir, te lo probás tranquila y te llevás el par que de verdad vas a usar.",
      textSide: "left",
      shoe: {
        src: "/placeholders/vizzano-6576-203.webp",
        width: 751,
        height: 476,
        alt: "Sandalia dorada de taco bajo con tiras anudadas",
        placeholderLabel: "Foto de ejemplo · catálogo Vizzano",
      },
    },
    {
      id: "todos-los-dias",
      number: "02",
      eyebrow: "Para todos los días",
      title: "Del lunes al domingo",
      body: "Tacos que se bancan el día entero, hormas cómodas y precios que cierran. Elegante, pero para usar.",
      textSide: "right",
      shoe: {
        src: "/placeholders/vizzano-1475-202.webp",
        width: 719,
        height: 497,
        alt: "Zapato plateado en punta con taco cuadrado y pulsera",
        placeholderLabel: "Foto de ejemplo · catálogo Vizzano",
      },
    },
  ] satisfies ChapterContent[],

  nav: {
    catalogLabel: "Catálogo",
    catalogHref: "/catalogo",
    homeHref: "/",
  },

  closing: {
    eyebrow: "Seguí por acá",
    title: "La colección",
    body: "Todos los modelos con precio y talles. Elegís el tuyo y lo consultás por WhatsApp.",
    cta: "Ver el catálogo",
  },

  catalog: {
    eyebrow: "La colección",
    title: "Elegí tu par",
    exampleNotice:
      "Catálogo de ejemplo: fotos del catálogo de Vizzano, nombres, precios y talles inventados.",
    allLabel: "Todos",
    sizeLabel: "Talle",
    pickSize: "Elegí tu talle",
    soldOut: "Sin stock",
    cta: "Consultar por WhatsApp",
    /** Mensaje precargado. Se reemplazan {producto}, {ref} y {talle}. */
    whatsappMessage: "Hola Martin! Quiero consultar por {producto} (ref. {ref}) en talle {talle}.",
    howToBuy: [
      { title: "Elegí modelo y talle", body: "Tocá tu talle en la foto del zapato." },
      { title: "Consultá por WhatsApp", body: "El mensaje ya sale escrito con el modelo y el talle." },
      { title: "Retirás o te lo enviamos", body: "Coordinamos pago y entrega por el mismo chat." },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
