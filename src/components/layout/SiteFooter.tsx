import { WordmarkImage } from "@/components/brand/Wordmark";

type Props = {
  name: string;
  tagline: string;
  visitTitle: string;
  contactTitle: string;
  address: string;
  hours: string;
  directionsLabel: string;
  /** Nombre del mapa para lectores de pantalla. */
  mapTitle: string;
  whatsappLabel: string;
  /** Enlace de WhatsApp, o vacío si todavía no hay número. */
  whatsappHref: string;
  instagramLabel: string;
  /** Usuario de Instagram sin @, o vacío. */
  instagram: string;
  /** Texto que reemplaza a un dato que falta. */
  pending: string;
  note?: string;
};

/** Pie de página corto: dónde está el local y cómo escribirle. */
export function SiteFooter({
  name,
  tagline,
  visitTitle,
  contactTitle,
  address,
  hours,
  directionsLabel,
  mapTitle,
  whatsappLabel,
  whatsappHref,
  instagramLabel,
  instagram,
  pending,
  note,
}: Props) {
  const heading = "mb-3 text-xs font-medium tracking-[0.18em] text-mint uppercase";
  const link = "underline decoration-mint underline-offset-4 hover:decoration-paper";
  return (
    <footer className="relative z-10 bg-ink px-5 pt-14 pb-10 text-paper lg:px-10 lg:pt-20">
      <div className="mx-auto grid max-w-[1300px] gap-10 sm:grid-cols-3">
        <div>
          <WordmarkImage label={name} className="h-10 lg:h-12" />
          <p className="mt-3 text-mint-soft">{tagline}</p>
        </div>
        <div>
          <h2 className={heading}>{visitTitle}</h2>
          <p>{address || pending}</p>
          <p className="mt-1 text-mint-soft">{hours || pending}</p>
          {address ? (
            <p className="mt-3">
              <a
                className={link}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {directionsLabel}
              </a>
            </p>
          ) : null}
        </div>
        <div>
          <h2 className={heading}>{contactTitle}</h2>
          <p>
            {whatsappHref ? (
              <a className={link} href={whatsappHref} target="_blank" rel="noopener noreferrer">
                {whatsappLabel}
              </a>
            ) : (
              `${whatsappLabel}: ${pending}`
            )}
          </p>
          <p className="mt-1">
            {instagram ? (
              <a
                className={link}
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {instagramLabel} @{instagram}
              </a>
            ) : (
              `${instagramLabel}: ${pending}`
            )}
          </p>
        </div>
      </div>
      {address ? (
        // Mapa de Google sin clave: se carga recién cuando la persona llega al
        // pie (loading="lazy"), así no pesa al abrir la página en el celular.
        <iframe
          title={mapTitle}
          src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="mx-auto mt-10 block h-64 w-full max-w-[1300px] rounded-2xl border-0 bg-ink-soft lg:h-80"
        />
      ) : null}
      {note ? (
        <p className="mx-auto mt-12 max-w-[1300px] border-t border-ink-soft pt-5 text-sm text-mint-soft">
          {note}
        </p>
      ) : null}
    </footer>
  );
}
