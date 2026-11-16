import type { ElementType } from "react";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
};

/**
 * Título partido en letras para animarlo una por una. Solo arma el marcado:
 * la animación la aplica ScrollStory a los `[data-char]`. Sin JavaScript o con
 * movimiento reducido se ve como un título normal. Los lectores de pantalla
 * leen el texto entero por `aria-label`.
 */
export function SplitTitle({ text, as: Tag = "h2", className }: Props) {
  const words = text.split(" ");
  return (
    <Tag aria-label={text} className={className}>
      {words.map((word, w) => (
        <span key={w} aria-hidden="true">
          <span className="split-word">
            {Array.from(word).map((char, c) => (
              <span key={c} data-char className="split-char">
                {char}
              </span>
            ))}
          </span>
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
