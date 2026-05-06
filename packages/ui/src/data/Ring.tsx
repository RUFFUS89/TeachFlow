import { clamp } from "@teachflow/utils";

import { cn } from "../cn";
import { TONE_RING, type Tone } from "../tones";

export interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  className?: string;
}

export function Ring({
  value,
  size = 56,
  stroke = 6,
  tone = "accent",
  label,
  className,
}: RingProps) {
  const pct = clamp(value, 0, 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const center = size / 2;

  return (
    <div
      role="img"
      aria-label={label ?? `${Math.round(pct)}%`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          strokeWidth={stroke}
          className="stroke-surfaceSunken"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={TONE_RING[tone]}
        />
      </svg>
      <span
        className="absolute font-display text-sm text-ink"
        style={{ fontSize: Math.max(10, size / 5) }}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}
