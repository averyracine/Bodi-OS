import type { JSX } from "react";

/**
 * Word-by-word reveal that keeps the heading as normal, readable text:
 * each word is an inline-block span and the spaces between them are real
 * text nodes, so screen readers, copy/paste and search engines all see
 * "Phoenix homes, remodeled start to finish." exactly.
 */
export function AnimatedHeading({
  text,
  as: Tag = "h1",
  className = "",
  delay = 0,
}: {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="reveal-word" style={{ animationDelay: `${delay + i * 70}ms` }}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
