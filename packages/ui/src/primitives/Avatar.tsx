import { type HTMLAttributes } from "react";

import { initialsOf } from "@teachflow/utils";

import { cn } from "../cn";
import { TONE_BG, type Tone } from "../tones";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  tone?: Tone;
}

const SIZE_CLASSES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-lg",
} as const;

function pickTone(name: string): Tone {
  const tones: Tone[] = ["peach", "sage", "caramel", "butter", "blush", "lilac", "accent"];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % tones.length;
  return tones[hash] ?? "peach";
}

export function Avatar({ name, src, size = "md", tone, className, ...rest }: AvatarProps) {
  const resolvedTone = tone ?? pickTone(name);
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full font-semibold",
        TONE_BG[resolvedTone],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initialsOf(name) || "?"
      )}
    </span>
  );
}
