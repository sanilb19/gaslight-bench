import type { ReactNode } from "react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/kit/tooltip";
import { cn } from "@/lib/utils";

export type SegmentedItem<Id extends string = string> = {
  /** Stable key reported by `onChange`. */
  id: Id;
  label: ReactNode;
  /** Optional leading Lucide icon. */
  icon?: LucideIcon;
  /** Optional hover/focus tooltip for the segment. */
  tooltip?: ReactNode;
};

// Generic over the item id so callers get a checked union back from `onChange`
// (and a checked `value`) instead of a bare `string` they have to cast.
export type SegmentedControlProps<Id extends string = string> = {
  "aria-label": string;
  items: SegmentedItem<Id>[];
  /** The selected item's `id`. */
  value: Id;
  onChange: (value: Id) => void;
  size?: "sm" | "md";
  className?: string;
};

/**
 * A pill of mutually-exclusive options — the segmented control / mode switcher
 * pattern. Built on react-aria-components' `ToggleButtonGroup` in single,
 * always-one-selected mode, so it's keyboard-navigable (arrow keys move
 * between segments, Home/End jump to the ends) and accessible out of the box.
 * Demo: `/_design`.
 */
export function SegmentedControl<Id extends string = string>({
  "aria-label": ariaLabel,
  items,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedControlProps<Id>) {
  return (
    <ToggleButtonGroup
      aria-label={ariaLabel}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={new Set([value])}
      onSelectionChange={(keys) => {
        // RAC reports keys as `Key` (string | number); our item ids are `Id`,
        // so the selected key is one of them by construction.
        const next = [...keys][0];
        if (next != null) onChange(String(next) as Id);
      }}
      className={cn(
        // `flex-wrap` + `max-w-full` lets a control with many segments wrap
        // onto additional rows within its container instead of overflowing.
        "inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-border bg-muted/40 p-1",
        className,
      )}
    >
      {items.map((item) => {
        const ItemIcon = item.icon;
        const button = (
          <ToggleButton
            key={item.id}
            id={item.id}
            className={cn(
              "flex select-none items-center gap-2 rounded-full font-medium outline-none transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              "text-muted-foreground data-[hovered=true]:text-foreground",
              "data-[selected=true]:bg-background data-[selected=true]:text-foreground data-[selected=true]:shadow-sm",
              "data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-ring",
            )}
          >
            {ItemIcon != null && (
              <ItemIcon className={size === "sm" ? "size-3.5" : "size-4"} />
            )}
            {item.label}
          </ToggleButton>
        );
        return item.tooltip != null ? (
          <Tooltip key={item.id} label={item.tooltip} side="bottom">
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </ToggleButtonGroup>
  );
}
