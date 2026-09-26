import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  /** Optional leading Lucide icon, shown in a soft round chip above the title. */
  icon?: LucideIcon;
  title: ReactNode;
  /** Supporting line; kept short and centered. */
  description?: ReactNode;
  /** Optional call-to-action (e.g. a Button) shown beneath the copy. */
  action?: ReactNode;
  className?: string;
};

/**
 * The standard "nothing here yet" placeholder: a centered icon chip, a title,
 * a short description, and an optional action. Fills its container and centers
 * both axes, so it drops straight into a panel or empty list/table region. Use
 * this everywhere instead of ad-hoc one-line empty messages.
 * Demo: `/_design`.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center",
        className,
      )}
    >
      {Icon != null && (
        <div className="mb-1 grid size-12 place-items-center rounded-full bg-muted/60 text-muted-foreground">
          <Icon className="size-6" />
        </div>
      )}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description != null && (
        <p className="max-w-xs text-balance text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action != null && <div className="mt-2">{action}</div>}
    </div>
  );
}
