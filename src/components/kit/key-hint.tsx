import * as React from "react";
import { cn } from "@/lib/utils";

// Map the hard-to-recognize Mac modifier/key glyphs to plain words. `⌘` is
// intentionally kept as a glyph — it's widely recognized and compact. Word
// forms ("Ctrl", "Alt", "Tab") pass through unchanged.
const KEY_TOKEN_LABELS: Record<string, string> = {
  "⌥": "Option",
  "⌃": "Control",
  "⇧": "Shift",
  "⇥": "Tab",
  "⌫": "Delete",
  "⌦": "Delete",
  "⏎": "Enter",
  "↩": "Enter",
  "⎋": "Esc",
  Alt: "Option",
};

function tokenize(display: string): string[] {
  return (
    display
      // Isolate modifier glyphs that may be glued to the key (e.g. "⌥T", "⌘⇧K")
      // so each renders as its own chip.
      .replace(/([⌘⌥⌃⇧])/g, " $1 ")
      .split(/\s*\+\s*|\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
  );
}

export interface KeyHintProps {
  /** Platform-aware display string, e.g. "⌘ ⇧ ." or "Ctrl + Shift + ." */
  display: string;
  className?: string;
  size?: "sm" | "xs";
}

/**
 * Renders a keyboard shortcut as a row of individual key chips. Uses the
 * regular UI font (not mono — the symbol glyphs are hard to read in mono) and
 * spells out the modifier names that aren't broadly recognized.
 * Demo: `/_design`.
 */
export function KeyHint({ display, className, size = "sm" }: KeyHintProps) {
  const tokens = tokenize(display);
  if (tokens.length === 0) return null;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {tokens.map((token, index) => (
        <kbd
          key={`${token}-${index}`}
          className={cn(
            "inline-flex select-none items-center justify-center rounded-md border border-border/60 bg-muted/70 font-sans font-medium leading-none text-muted-foreground",
            size === "xs"
              ? "h-5 min-w-[1.25rem] px-1.5 text-[11px]"
              : "h-6 min-w-[1.5rem] px-2 text-xs",
          )}
        >
          {KEY_TOKEN_LABELS[token] ?? token}
        </kbd>
      ))}
    </span>
  );
}
