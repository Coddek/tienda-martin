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

export type BrandColor = "ink" | "inkSoft" | "paper" | "mint" | "mintSoft" | "gold" | "rust";

export type ChapterContent = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  /** Color de fondo del capítulo (clave de `colors`). El fondo se funde de uno a otro al scrollear. */
  background: BrandColor;
  /** Palabra gigante en contorno que cruza por detrás del zapato. */
  backdropWord: string;
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
    hours: "",
  },

  hero: {
    eyebrow: "Calzado femenino",
    tagline: "Elegante, para todos los días.",
    scrollHint: "Deslizá",
  },

  /**
   * Destacados de la portada: lo más vendido, lo que está de moda o lo que haya
   * en stock. Se cambia acá (más adelante, desde el panel). El primero es el que
   * aparece en grande al abrirse el isotipo.
   */
  featured: {
    eyebrow: "Esta semana",
    title: "Lo más elegido",
    backdropWord: "Favoritos",
    background: "ink" satisfies BrandColor,
    textSide: "left" as "left" | "right",
    productIds: [
      "sandalia-nudo-dorada",
      "zapato-pulsera-plata",
      "sandalia-lazo-negra",
      "botineta-chocolate",
    ],
    cta: "Ver todo el catálogo",
    placeholderLabel: "Foto de ejemplo · catálogo Vizzano",
  },

  nav: {
    catalogLabel: "Catálogo",
    catalogHref: "/catalogo",
    /** Ancla del catálogo dentro de la portada. */
    catalogAnchor: "catalogo",
    homeHref: "/",
  },

  /** Botón flotante de WhatsApp (consulta general, sin producto). */
  whatsappFab: {
    label: "Escribinos por WhatsApp",
    message: "Hola Martin! Quiero hacer una consulta.",
  },

  /** Cinta de palabras que corre entre los destacados y el catálogo. */
  marquee: ["Sandalias", "Zapatos", "Botas", "Urbanas", "Vizzano"],

  footer: {
    directions: "Cómo llegar",
    visitTitle: "Vení al local",
    contactTitle: "Escribinos",
    whatsappLabel: "WhatsApp",
    instagramLabel: "Instagram",
    /** Se muestra en lugar de un dato de contacto que todavía no se cargó. */
    pending: "A completar",
    note: "Sitio en preparación. Fotos, precios y talles de ejemplo.",
  },

  catalog: {
    eyebrow: "La colección",
    title: "Elegí tu par",
    exampleNotice:
      "Catálogo de ejemplo: fotos del catálogo de Vizzano, nombres, precios y talles inventados.",
    allLabel: "Todos",
    /** Filtro "tengo 37": muestra solo lo que hay en ese número. */
    sizeFilterLabel: "Tu talle",
    emptyLabel: "No hay modelos con esos filtros. Probá con otro talle o categoría.",
    /** Etiquetas de las tarjetas (clave = `tag` del producto). */
    tags: { nuevo: "Nuevo", ultimos: "Últimos pares", oferta: "Oferta" },
    viewProduct: "Ver detalle",
    share: "Compartir",
    shared: "Enlace copiado",
    related: "También te puede gustar",
    backToCatalog: "Volver al catálogo",
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
