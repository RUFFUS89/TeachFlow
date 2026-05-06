import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "../cn";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "ghost" | "soft" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-bg hover:bg-inkSoft active:bg-ink/90 disabled:bg-inkMuted/40 disabled:text-bg/70",
  ghost:
    "bg-transparent text-ink hover:bg-surface2 active:bg-surfaceSunken disabled:text-inkMuted",
  soft:
    "bg-surface2 text-ink hover:bg-surfaceSunken active:bg-bgAlt disabled:bg-surface2 disabled:text-inkMuted",
  danger:
    "bg-blushInk text-bg hover:bg-blushInk/90 active:bg-blushInk/80 disabled:bg-blushInk/40",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs rounded-pill",
  md: "h-10 gap-2 px-4 text-sm rounded-pill",
  lg: "h-12 gap-2.5 px-5 text-base rounded-pill",
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  full?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    icon,
    iconRight,
    loading = false,
    full = false,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const iconSize = ICON_SIZE[size];
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
});
