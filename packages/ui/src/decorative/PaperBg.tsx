import { cn } from "../cn";

export interface PaperBgProps {
  opacity?: number;
  className?: string;
}

export function PaperBg({ opacity = 0.04, className }: PaperBgProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "16px 16px",
        opacity,
      }}
    />
  );
}
