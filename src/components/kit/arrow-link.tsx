import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Directional arrows drawn from the font (no icon set required). These sit on
 * the type's optical axis, so they center cleanly in links and buttons:
 *
 * - `right` (→)     primary forward action — Continue, Next, Read more
 * - `left` (←)      go back — Back, Previous
 * - `up` (↑)        jump / scroll to top
 * - `down` (↓)      scroll down, jump to a section
 * - `up-right` (↗)  external / new-tab link
 */
export const ARROW_GLYPHS = {
  left: "←",
  up: "↑",
  right: "→",
  down: "↓",
  "up-right": "↗",
} as const;

export type ArrowDirection = keyof typeof ARROW_GLYPHS;

// ↗ defaults to color-emoji presentation; request the monochrome text glyph so
// it matches the surrounding type.
const TEXT_GLYPH: CSSProperties = { fontVariantEmoji: "text" } as CSSProperties;

// On hover the arrow nudges in its own direction.
const NUDGE: Record<ArrowDirection, string> = {
  left: "group-hover:-translate-x-0.5",
  right: "group-hover:translate-x-0.5",
  up: "group-hover:-translate-y-0.5",
  down: "group-hover:translate-y-0.5",
  "up-right": "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
};

function Arrow({
  direction,
  leading,
}: {
  direction: ArrowDirection;
  leading: boolean;
}) {
  return (
    <span
      aria-hidden
      style={TEXT_GLYPH}
      className={cn(
        "inline-block font-mono transition-transform duration-200 ease-out",
        leading ? "order-first" : "order-last",
        NUDGE[direction],
      )}
    >
      {`${ARROW_GLYPHS[direction]}\uFE0E`}
    </span>
  );
}

export type ArrowLinkProps = ComponentProps<"a"> & {
  /** Which arrow glyph to show — see `ARROW_GLYPHS` for semantics. */
  direction?: ArrowDirection;
  /** Place the arrow before the label instead of after. */
  leading?: boolean;
};

/**
 * A text link with a font-drawn directional arrow that nudges on hover. The
 * underline is a bottom border on the whole link, so it runs continuously
 * under both the label and the arrow (no gap). Needs no icon dependency.
 * Demo: `/_design`.
 */
export function ArrowLink({
  direction = "right",
  leading = false,
  className,
  children,
  ...props
}: ArrowLinkProps) {
  return (
    <a
      className={cn(
        "group inline-flex items-center gap-1 border-b border-transparent font-medium text-foreground transition-colors hover:border-current",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <Arrow direction={direction} leading={leading} />
    </a>
  );
}
