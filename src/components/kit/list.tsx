import type { ReactNode } from "react";
import {
  Header,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  ListBoxSection,
  type Key,
  type Selection,
} from "react-aria-components";
import { cn } from "@/lib/utils";

export type { Key, Selection };

export type ListProps<T extends object> = {
  "aria-label": string;
  /** "none" makes an actionable list (Enter/Space → onAction, no checkmarks). */
  selectionMode?: "none" | "single" | "multiple";
  selectedKeys?: "all" | Iterable<Key>;
  defaultSelectedKeys?: "all" | Iterable<Key>;
  onSelectionChange?: (keys: Selection) => void;
  onAction?: (key: Key) => void;
  /** Dynamic collection; pair with a render-function child. */
  items?: Iterable<T>;
  className?: string;
  /** Caps the scroll viewport height. Defaults to `max-h-80`; pass e.g.
   * `max-h-none` for a short list that should size to its content. */
  viewportClassName?: string;
  children: ReactNode | ((item: T) => ReactNode);
};

/**
 * A keyboard-navigable list built on react-aria-components' `ListBox`. Arrow
 * keys move focus, type-ahead jumps to a matching row, Home/End jump to ends,
 * and Enter/Space select or activate — all accessible out of the box. Compose
 * rows with `ListItem` and group them with `ListSection`.
 *
 * For static navigation links, use plain `<a>`/`<ul>` markup instead — a
 * listbox is the wrong semantics for nav. Reserve this for genuinely
 * interactive lists (pickers, selectable rows, action lists).
 * Demo: `/_design`.
 */
export function List<T extends object>({
  className,
  children,
  items,
  viewportClassName = "max-h-80",
  ...props
}: ListProps<T>) {
  return (
    <div
      className={cn(
        "overflow-y-auto rounded-xl border border-border bg-card",
        viewportClassName,
        className,
      )}
    >
      <ListBox
        {...props}
        items={items}
        className="flex flex-col gap-0.5 p-1 outline-none"
      >
        {children as never}
      </ListBox>
    </div>
  );
}

/** A single row. `id` is required; pass `textValue` when children aren't plain text (powers type-ahead). */
export function ListItem({ className, children, ...props }: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className={cn(
        "group flex select-none items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none transition-colors",
        "data-[hovered=true]:bg-muted/60 data-[hovered=true]:text-foreground",
        "data-[focused=true]:bg-muted/60 data-[focused=true]:text-foreground",
        "data-[selected=true]:bg-muted data-[selected=true]:font-medium data-[selected=true]:text-foreground",
        "data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-inset data-[focus-visible=true]:ring-ring",
        "data-[disabled=true]:opacity-50",
        className,
      )}
    >
      {children}
    </ListBoxItem>
  );
}

export type ListSectionProps = {
  title?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A titled group of rows. Sections are skipped by type-ahead and arrow nav. */
export function ListSection({ title, className, children }: ListSectionProps) {
  return (
    <ListBoxSection className={cn("pb-1", className)}>
      {title != null && (
        <Header className="px-3 pb-1 pt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {title}
        </Header>
      )}
      {children}
    </ListBoxSection>
  );
}
