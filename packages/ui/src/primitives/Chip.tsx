import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../cn";
import { TONE_BG, type Tone } from "../tones";
import { Icon, type IconName } from "./Icon";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: "sm" | "md";
  icon?: IconName;
  children?: ReactNode;
}

const SIZE_CLASSES = {
  sm: "h-6 gap-1 px-2 text-[11px]",
  md: "h-7 gap-1.5 px-2.5 text-xs",
} as const;

const ICON_SIZE = { sm: 12, md: 14 } as const;

export function Chip({ tone = "neutral", size = "md", icon, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill font-medium",
        TONE_BG[tone],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={ICON_SIZE[size]} />}
      {children}
    </span>
  );
}
