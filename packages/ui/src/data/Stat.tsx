import { type ReactNode } from "react";

import { cn } from "../cn";
import { Icon, type IconName } from "../primitives/Icon";
import { TONE_BG, type Tone } from "../tones";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: "up" | "down" | "neutral";
  icon?: IconName;
  tone?: Tone;
  className?: string;
}

const DELTA_COLOR = {
  up: "text-sageInk",
  down: "text-blushInk",
  neutral: "text-inkMuted",
} as const;

export function Stat({ label, value, delta, deltaTone = "neutral", icon, tone, className }: StatProps) {
  return (
    <div className={cn("rounded-card border border-border bg-surface p-5", className)}>
      <div className="flex items-start justify-between">
        <span className="text-xs text-inkMuted">{label}</span>
        {icon && tone && (
          <span className={cn("flex size-8 items-center justify-center rounded-card", TONE_BG[tone])}>
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-2xl text-ink">{value}</div>
      {delta && <div className={cn("mt-1 text-xs font-medium", DELTA_COLOR[deltaTone])}>{delta}</div>}
    </div>
  );
}
