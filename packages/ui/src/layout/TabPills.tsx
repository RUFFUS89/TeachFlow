"use client";

import { type ReactNode } from "react";

import { cn } from "../cn";

export interface TabPill {
  value: string;
  label: ReactNode;
  count?: number;
}

export interface TabPillsProps {
  items: TabPill[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
} as const;

export function TabPills({ items, value, onChange, size = "md", className }: TabPillsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-pill border border-border bg-surface p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15",
              SIZE_CLASSES[size],
              active ? "bg-ink text-bg" : "text-inkSoft hover:bg-surface2",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-pill px-1.5 text-[10px]",
                  active ? "bg-bg/20 text-bg" : "bg-surface2 text-inkMuted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
