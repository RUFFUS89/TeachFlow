import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";

import { cn } from "../cn";
import { Label } from "./Label";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
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
      <textarea
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={helper || error ? helperId : undefined}
        className={cn(
          "min-h-24 rounded-field border bg-surface px-3 py-2 text-sm text-ink placeholder:text-inkMuted",
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
