import type { ReactElement, ReactNode } from "react";
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type TooltipProps = {
  /** Tooltip text (or richer content). */
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Hover delay in ms before the tooltip opens. */
  delay?: number;
  /**
   * The element the tooltip describes — it becomes the hover/focus trigger
   * (its props are merged via Base UI's `render`, so no extra wrapper node).
   * Pass a single element.
   */
  children: ReactElement;
};

/**
 * The standard hover/focus tooltip. Wrap any element to give it a label:
 *
 *   <Tooltip label="Copy link"><Button size="icon">…</Button></Tooltip>
 *
 * Use this everywhere instead of the native `title` attribute or bespoke
 * popovers, so tooltips look and behave the same across the site.
 * Demo: `/_design`.
 */
export function Tooltip({
  label,
  side = "top",
  align = "center",
  sideOffset = 6,
  delay = 300,
  children,
}: TooltipProps) {
  return (
    <TooltipProvider delay={delay}>
      <TooltipRoot>
        <TooltipTrigger render={children} />
        <TooltipContent side={side} align={align} sideOffset={sideOffset}>
          {label}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
