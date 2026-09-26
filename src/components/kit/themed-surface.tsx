import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The semantic color tokens defined in `src/styles.css` (via theme.json). */
export type SemanticColorToken =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "border"
  | "input"
  | "ring";

/** Per-token color overrides, keyed by semantic token name → any CSS color. */
export type ThemeOverrides = Partial<Record<SemanticColorToken, string>>;

export interface ThemedSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Semantic tokens to override for this subtree, e.g.
   * `{ background: "oklch(0.21 0 0)", foreground: "oklch(0.99 0 0)" }`.
   * Omitted tokens inherit the ambient theme.
   */
  overrides: ThemeOverrides;
  children?: ReactNode;
}

/**
 * Re-theme a subtree by setting the design tokens as inline CSS custom
 * properties on a wrapper. Because `bg-background`, `text-foreground`,
 * `bg-primary`, … all resolve `var(--<token>)`, overriding a token here
 * cascades to every descendant that uses it — no new classes, no prop-drilling
 * a color.
 *
 * Use it for a region that should read as a different surface than the page
 * it sits on: a permanently-dark hero band inside a light page, an embedded
 * preview that carries its own palette, a callout tinted off a brand color.
 * Demo: `/_design`.
 */
export function ThemedSurface({
  overrides,
  className,
  style,
  children,
  ...rest
}: ThemedSurfaceProps) {
  const themeVars: Record<string, string> = {};
  for (const [token, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      themeVars[`--${token}`] = value;
    }
  }

  // React renders CSS custom properties in inline styles at runtime, but its
  // `CSSProperties` type doesn't enumerate `--*` keys — assert once here.
  const mergedStyle = { ...style, ...themeVars } as CSSProperties;

  return (
    <div className={cn(className)} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
}
