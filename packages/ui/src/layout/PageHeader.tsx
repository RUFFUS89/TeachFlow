import { type ReactNode } from "react";

import { cn } from "../cn";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="font-mono text-xs uppercase tracking-wider text-inkMuted">{eyebrow}</span>
        )}
        <h1 className="font-display text-2xl text-ink md:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-inkMuted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
