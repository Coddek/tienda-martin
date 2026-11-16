import Link from "next/link";

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
};

/** Cierre del recorrido: invita a pasar al catálogo. */
export function Closing({ eyebrow, title, body, cta, href }: Props) {
  return (
    <section
      data-closing
      className="relative flex min-h-[80svh] flex-col items-center justify-center px-5 py-24 text-center"
    >
      <p className="mb-5 text-xs font-medium tracking-[0.18em] text-mint-soft uppercase lg:text-base">
        {eyebrow}
      </p>
      <h2 className="font-display text-[16vw] leading-[0.9] text-paper italic lg:text-[clamp(5rem,10vw,11rem)]">
        {title}
      </h2>
      <p className="mt-6 max-w-[34ch] text-[1.08rem] leading-relaxed text-paper lg:text-2xl">
        {body}
      </p>
      <Link
        href={href}
        className="mt-10 inline-flex min-h-12 items-center rounded-full bg-rust px-8 text-sm font-semibold tracking-[0.12em] text-paper uppercase transition-transform hover:scale-[1.03] lg:text-base"
      >
        {cta}
      </Link>
    </section>
  );
}
