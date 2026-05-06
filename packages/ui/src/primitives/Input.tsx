import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "../cn";
import { Label } from "./Label";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, required, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={helper || error ? helperId : undefined}
        className={cn(
          "h-10 rounded-field border bg-surface px-3 text-sm text-ink placeholder:text-inkMuted",
          "focus:outline-none focus:ring-2 focus:ring-ink/15 focus:border-ink/30",
          "disabled:bg-surface2 disabled:text-inkMuted",
          error ? "border-blushInk/50" : "border-border",
          className,
        )}
        {...rest}
      />
      {(helper || error) && (
        <span id={helperId} className={cn("text-xs", error ? "text-blushInk" : "text-inkMuted")}>
          {error ?? helper}
        </span>
      )}
    </div>
  );
});
