import { type HTMLAttributes } from "react";

import { cn } from "../cn";
import { TONE_BG, type Tone } from "../tones";

export type BadgeStatus = "active" | "draft" | "scheduled" | "graded" | "late" | "returned";

const STATUS_TONE: Record<BadgeStatus, Tone> = {
  active: "sage",
  draft: "neutral",
  scheduled: "lilac",
  graded: "sage",
  late: "blush",
  returned: "butter",
};

const STATUS_LABEL: Record<BadgeStatus, string> = {
  active: "Ativo",
  draft: "Rascunho",
  scheduled: "Agendado",
  graded: "Corrigido",
  late: "Atrasado",
  returned: "Devolvido",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  tone?: Tone;
}

export function Badge({ status, tone, className, children, ...rest }: BadgeProps) {
  const resolvedTone = tone ?? (status ? STATUS_TONE[status] : "neutral");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TONE_BG[resolvedTone],
        className,
      )}
      {...rest}
    >
      {children ?? (status ? STATUS_LABEL[status] : null)}
    </span>
  );
}
