import { clamp } from "@teachflow/utils";

import { cn } from "../cn";
import { TONE_BG, type Tone } from "../tones";

export interface ProgressBarProps {
  value: number;
  tone?: Tone;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  tone = "accent",
  label,
  showValue = false,
  className,
}: ProgressBarProps) {
  const pct = clamp(value, 0, 100);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-inkMuted">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-pill bg-surfaceSunken"
      >
        <div
          className={cn("h-full rounded-pill transition-[width]", TONE_BG[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
