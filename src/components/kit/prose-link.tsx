import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ProseLinkProps = ComponentProps<"a"> & {
  /** Open in a new tab with a safe `rel`. */
  external?: boolean;
};

/**
 * An inline link styled for body / marketing prose — medium weight with a soft
 * underline that strengthens on hover. Use it for links that sit *within*
 * running text (in-page `#anchor` jumps or external links); for standalone
 * directional links (Continue, Back, Read more) reach for `ArrowLink` instead.
 * Demo: `/_design`.
 */
export function ProseLink({
  external,
  className,
  children,
  ...props
}: ProseLinkProps) {
  return (
    <a
      className={cn(
        "font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground",
        className,
      )}
      {...props}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
