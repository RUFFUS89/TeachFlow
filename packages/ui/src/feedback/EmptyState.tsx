import { type ReactNode } from "react";

import { cn } from "../cn";
import { Icon, type IconName } from "../primitives/Icon";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = "sparkle", title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-surface2 text-inkMuted">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-inkMuted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
