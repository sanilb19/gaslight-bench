import { type CSSProperties, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Looping Braille spinner frames. Each variant is a sequence of glyphs that,
 * when cycled, reads as a single animated cell — no SVG or images, just the font.
 */
export const SPINNER_FRAMES = {
  bounce: Array.from("⠃⠋⠉⠙⠘⠚⠒⠖⠆⠦⠤⠴⠰⠲⠒⠓"),
  wave: Array.from(
    "⣿⣾⣷⣯⣽⣟⣻⢿⡿⡟⡏⡇⢇⢣⢱⢸⡸⡜⡎⡇⣇⣧⣷⣿⣾⣼⣸⣘⣨⣈⣀⢄⡠⠤⠔⠢⠒⠑⠊⠉⠑⠕⠗⠖⠴⢴⢔⢜⢕⢝⢟⡻⡫⡛⡿",
  ),
} as const;

export type SpinnerVariant = keyof typeof SPINNER_FRAMES;

// `bounce` uses 6-dot Braille (rows 1–3) which sits in the cap-to-baseline band
// and centers cleanly. `wave` uses 8-dot Braille (the ⣿ family) that reaches
// into the descender row, dropping its ink below the text's optical center —
// so lift it a touch. Baked in here so callers never nudge it themselves.
const VARIANT_OFFSET: Record<SpinnerVariant, string | undefined> = {
  bounce: undefined,
  wave: "translateY(-0.09em)",
};

function useSpinnerFrame(length: number, fps: number): number {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 0 || fps <= 0) return;
    const id = window.setInterval(
      () => setIndex((prev) => (prev + 1) % length),
      1000 / fps,
    );
    return () => window.clearInterval(id);
  }, [length, fps]);
  return index;
}

export type SpinnerProps = {
  /** Which looping animation to play. */
  variant?: SpinnerVariant;
  /** Frames per second. */
  fps?: number;
  /** Explicit pixel size. Defaults to the inherited font-size. */
  size?: number;
  /** Accessible status label; the glyph itself is decorative. */
  label?: string;
  className?: string;
};

/**
 * An inline, font-driven loading spinner. Sized by `size` (or the inherited
 * font-size) and colored by `currentColor`, so it drops into buttons, status
 * text, and pills, or scales up as a decorative loader.
 * Demo: `/_design`.
 */
export function Spinner({
  variant = "bounce",
  fps = 8,
  size,
  label = "Loading",
  className,
}: SpinnerProps) {
  const frames = SPINNER_FRAMES[variant];
  const index = useSpinnerFrame(frames.length, fps);
  const style: CSSProperties = { fontWeight: 700 };
  if (size) style.fontSize = size;
  const offset = VARIANT_OFFSET[variant];
  if (offset) style.transform = offset;
  return (
    <span
      role="status"
      aria-label={label}
      style={style}
      className={cn(
        "inline-block align-middle font-mono leading-none tabular-nums",
        className,
      )}
    >
      <span aria-hidden>{frames[index]}</span>
    </span>
  );
}
