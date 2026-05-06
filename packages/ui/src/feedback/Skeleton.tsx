import { type HTMLAttributes } from "react";

import { cn } from "../cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-field bg-surfaceSunken", className)}
      aria-hidden
      {...rest}
    />
  );
}
