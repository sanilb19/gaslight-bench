import type { ReactNode } from "react";
import { useRef, useState } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  Header,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  MenuSection as AriaMenuSection,
  MenuTrigger,
  type Placement,
  Popover,
  Separator,
} from "react-aria-components";
import { Check, type LucideIcon } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { KeyHint } from "@/components/kit/key-hint";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export { MenuTrigger };

/**
 * The trigger button for a `MenuTrigger`. React-aria only delivers the menu's
 * open/close press handling to its own Button, so the plain `ui/button` will
 * NOT open the menu — always use `MenuButton` (styled identically via
 * `buttonVariants`) as the first child of `MenuTrigger`.
 */
export function MenuButton({
  variant = "outline",
  size = "default",
  className,
  children,
  ...props
}: AriaButtonProps &
  Pick<VariantProps<typeof buttonVariants>, "variant" | "size"> & {
    children: ReactNode;
  }) {
  return (
    <AriaButton
      {...props}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </AriaButton>
  );
}

// Shared popover chassis: a floating card with theme tokens and tw-animate-css
// enter/exit transitions keyed off RAC's data-[entering]/data-[exiting].
const POPOVER_CLASS = cn(
  "min-w-[12rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
  "data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95",
  "data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95",
);

const MENU_CLASS = "flex flex-col gap-0.5 outline-none";

/**
 * A popup menu built on react-aria-components — full keyboard support (arrow
 * keys, type-ahead, Home/End, Escape) out of the box. Use as the second child
 * of a `MenuTrigger` (the first being the trigger element) for a click/kebab
 * menu, or pass the same `MenuItem`s to `ContextMenuTrigger` for a right-click
 * menu. Compose rows with `MenuItem`, group with `MenuSection`, divide with
 * `MenuSeparator`.
 * Demo: `/_design`.
 */
export function Menu({
  children,
  onAction,
  className,
  placement = "bottom end",
  selectionMode,
  selectedKeys,
  onSelectionChange,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  onAction?: (key: string) => void;
  className?: string;
  /** Popover placement relative to the trigger (RAC). Defaults to `bottom end`. */
  placement?: Placement;
  /**
   * For picker-style menus, prefer RAC selection (`selectionMode="single"` +
   * `selectedKeys`/`onSelectionChange`) — it announces `aria-checked` and
   * renders the row's trailing check automatically. The `MenuItem.selected`
   * prop is the manual fallback for one-off cases.
   */
  selectionMode?: "none" | "single" | "multiple";
  selectedKeys?: Iterable<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  "aria-label": string;
}) {
  return (
    <Popover className={POPOVER_CLASS} placement={placement} offset={6}>
      <AriaMenu
        aria-label={ariaLabel}
        onAction={(key) => onAction?.(String(key))}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          onSelectionChange?.(new Set([...keys].map(String)));
        }}
        className={cn(MENU_CLASS, className)}
      >
        {children}
      </AriaMenu>
    </Popover>
  );
}

export type MenuItemProps = Omit<AriaMenuItemProps, "children"> & {
  /** Optional leading Lucide icon. */
  icon?: LucideIcon;
  /** Right-aligned keyboard shortcut, e.g. "⌘D" — rendered as key chips. */
  shortcut?: string;
  /** Show a trailing check — use for single-select menus (e.g. a theme picker). */
  selected?: boolean;
  /** Red styling for irreversible actions like Delete. */
  variant?: "default" | "destructive";
  children: ReactNode;
};

/** A single menu row. Give it an `id` and wire behavior with `onAction`. */
export function MenuItem({
  icon: Icon,
  shortcut,
  selected,
  variant = "default",
  className,
  children,
  ...props
}: MenuItemProps) {
  return (
    <AriaMenuItem
      {...props}
      className={cn(
        "group flex select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none transition-colors",
        "data-[focused=true]:bg-muted/60 data-[focused=true]:text-foreground",
        "data-[disabled=true]:opacity-50",
        "data-[selected=true]:text-foreground",
        selected && "text-foreground",
        variant === "destructive" &&
          "text-destructive data-[focused=true]:bg-destructive/10 data-[focused=true]:text-destructive",
        className,
      )}
    >
      {(renderProps) => (
        <>
          {Icon != null && <Icon className="size-[18px]" />}
          <span className="flex-1">{children}</span>
          {shortcut != null && (
            <KeyHint display={shortcut} size="xs" className="ml-2" />
          )}
          {(selected || renderProps.isSelected) && (
            <Check className="size-4 text-foreground" />
          )}
        </>
      )}
    </AriaMenuItem>
  );
}

/** A divider between groups of items. */
export function MenuSeparator({ className }: { className?: string }) {
  return <Separator className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

/** A titled group of menu rows. */
export function MenuSection({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AriaMenuSection className={cn("flex flex-col gap-0.5", className)}>
      {title != null && (
        <Header className="px-3 pb-1 pt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {title}
        </Header>
      )}
      {children}
    </AriaMenuSection>
  );
}

/**
 * Wraps arbitrary content and opens a menu on right-click (or long-press on
 * touch), anchored at the pointer. Pass the same `MenuItem`s you'd give `Menu`.
 */
export function ContextMenuTrigger({
  children,
  menu,
  onAction,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  menu: ReactNode;
  onAction?: (key: string) => void;
  className?: string;
  "aria-label": string;
}) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);

  return (
    <div
      className={className}
      onContextMenu={(event) => {
        event.preventDefault();
        setPoint({ x: event.clientX, y: event.clientY });
      }}
    >
      {children}
      {/* Zero-size anchor the popover positions against. */}
      <span
        ref={anchorRef}
        aria-hidden
        className="pointer-events-none fixed"
        style={{ left: point?.x ?? 0, top: point?.y ?? 0 }}
      />
      <Popover
        triggerRef={anchorRef}
        isOpen={point !== null}
        onOpenChange={(open) => {
          if (!open) setPoint(null);
        }}
        placement="bottom start"
        offset={4}
        className={POPOVER_CLASS}
      >
        <AriaMenu
          aria-label={ariaLabel}
          autoFocus="first"
          onAction={(key) => {
            onAction?.(String(key));
            setPoint(null);
          }}
          className={MENU_CLASS}
        >
          {menu}
        </AriaMenu>
      </Popover>
    </div>
  );
}
