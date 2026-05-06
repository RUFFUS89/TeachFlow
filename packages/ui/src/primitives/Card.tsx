import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../cn";
import { TONE_BG, type Tone } from "../tones";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  padding?: "none" | "sm" | "md" | "lg";
  surface?: "default" | "raised" | "sunken";
}

const PADDING: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const SURFACE: Record<NonNullable<CardProps["surface"]>, string> = {
  default: "bg-surface",
  raised: "bg-surface shadow-sm",
  sunken: "bg-surface2",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone, padding = "md", surface = "default", className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-card border border-border",
        tone ? TONE_BG[tone] : SURFACE[surface],
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
});
