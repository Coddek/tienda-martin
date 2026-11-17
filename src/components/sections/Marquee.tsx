type Props = {
  words: readonly string[];
};

/**
 * Cinta de palabras gigantes que corre sola, alternando relleno y contorno.
 * Separa el recorrido oscuro del catálogo claro. Es decorativa: los lectores de
 * pantalla la ignoran, y con movimiento reducido queda quieta.
 */
export function Marquee({ words }: Props) {
  // Dos copias seguidas: la animación corre media cinta y vuelve a empezar sin corte.
  const loop = [...words, ...words];
  return (
    <div aria-hidden="true" className="relative overflow-hidden bg-ink py-6 lg:py-10">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {loop.map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span
                  className={`font-display text-[17vw] leading-none italic lg:text-[8.5vw] ${
                    i % 2 ? "outline-gold" : "text-gold"
                  }`}
                >
                  {word}
                </span>
                <span className="mx-[5vw] block h-2 w-2 rotate-45 bg-mint lg:mx-[3vw] lg:h-3 lg:w-3" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
