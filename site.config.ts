/**
 * Identidad y contenido del sitio. Para usar esta base en otro negocio se cambia
 * este archivo, `src/app/fonts.ts`, `src/components/brand/isotipo-paths.ts` y las
 * imágenes de `public/`. Ningún componente escribe colores ni textos a mano.
 */

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
    /** Texto para lectores de pantalla; el dibujo está en src/components/brand/wordmark-paths.ts. */
    text: "Martin",
    /** Vectorizado del ícono original de 1024 px (ver wordmark-paths.ts). */
    provisional: false,
    provisionalLabel: "Logotipo provisorio",
  },

  isotipo: {
    /** Vectorizado del ícono original de 1024 px (ver isotipo-paths.ts). */
    provisional: false,
  },

  contact: {
    /** Pendiente: número con código de país, sin signos. */
    whatsapp: "",
    /** Usuario, sin @. */
    instagram: "zapateria.martin",
    address: "Concejal Tribulato 1127, B1663 San Miguel, Provincia de Buenos Aires",
    hours: "Lunes a sábado de 9 a 20 h",
  },

  hero: {
    eyebrow: "Calzado femenino",
    tagline: "Elegante, para todos los días.",
    scrollHint: "Deslizá",
  },

  /**
   * Destacados de la portada: los productos marcados como destacados (en la
   * base, desde el editor). Aparecen en una pasarela que se desliza apenas se
   * abre el isotipo.
   */
  featured: {
    eyebrow: "Esta semana",
    title: "Lo más elegido",
    swipeHint: "Deslizá para ver más",
    cta: "Ver todo el catálogo",
  },

  nav: {
    catalogLabel: "Catálogo",
    catalogHref: "/catalogo",
    /** Ancla del catálogo dentro de la portada. */
    catalogAnchor: "catalogo",
    homeHref: "/",
  },

  /** Página para enlaces rotos o productos que ya no están. */
  notFound: {
    eyebrow: "Error 404",
    title: "No encontramos esta página",
    body: "Puede que el modelo ya no esté o que el enlace tenga un error. El catálogo está completo y actualizado.",
    cta: "Ver el catálogo",
    home: "Ir al inicio",
  },

  /** Imagen y texto que se ven al compartir el enlace de la portada. */
  share: {
    imageAlt: "Martin, calzado femenino",
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
    mapTitle: "Mapa del local",
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
    colorLabel: "Color",
    /** Favoritos: se guardan en el teléfono de la persona y se consultan todos juntos. */
    favorites: {
      filter: "Favoritos",
      add: "Guardar en favoritos",
      remove: "Quitar de favoritos",
      /** Botón flotante: abre la lista (desde ahí se consulta). */
      consult: "Mis favoritos",
      /** Panel que se despliega desde el botón de favoritos. */
      panelTitle: "Tus favoritos",
      panelHint: "Revisá la lista antes de consultar: podés quitar los que no quieras.",
      consultAll: "Consultar por WhatsApp",
      removeOne: "Quitar",
      clear: "Vaciar lista",
      clearConfirm: "¿Quitar todos los modelos de tu lista?",
      clearYes: "Sí, vaciar",
      clearCancel: "No, dejarlos",
      close: "Cerrar",
      view: "Ver",
      empty: "Todavía no guardaste ningún modelo. Tocá el corazón de los que te gusten.",
      messageIntro: "Hola Martin! Quiero consultar por estos modelos:",
      /** Se reemplazan {producto}, {ref}, {talle} y {link} (la ficha del producto). */
      messageLine: "• {producto}, talle {talle} (ref. {ref})\n{link}",
      noSize: "a confirmar",
    },
    sortLabel: "Ordenar",
    sortOptions: {
      destacados: "Destacados",
      novedades: "Novedades",
      menor: "Menor precio",
      mayor: "Mayor precio",
    },
    /** Una línea sobre medios de pago y cambios. Vacío = no se muestra. */
    paymentNote: "",
    share: "Compartir",
    shared: "Enlace copiado",
    related: "También te puede gustar",
    backToCatalog: "Volver al catálogo",
    sizeLabel: "Talle",
    pickSize: "Elegí tu talle",
    soldOut: "Sin stock",
    /** Avisos de poco stock: nunca se muestra el número exacto. */
    stock: {
      lowShort: { ultimo: "Último", quedan2: "Quedan 2" },
      low: { ultimo: "Último par", quedan2: "Quedan 2 pares" },
      /** El talle que se ve es el argentino; el brasileño es el de la etiqueta. */
      arLabel: "AR",
      brLabel: "BR",
    },
    cta: "Consultar por WhatsApp",
    /** Mensaje precargado. Se reemplazan {producto}, {ref}, {talle} y {link} (la ficha del producto). */
    whatsappMessage:
      "Hola Martin! Quiero consultar por {producto} en talle {talle} (ref. {ref}).\n{link}",
    howToBuy: [
      { title: "Elegí modelo y talle", body: "Tocá tu talle en la foto del zapato." },
      { title: "Consultá por WhatsApp", body: "El mensaje ya sale escrito con el modelo y el talle." },
      { title: "Retirás o te lo enviamos", body: "Coordinamos pago y entrega por el mismo chat." },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
