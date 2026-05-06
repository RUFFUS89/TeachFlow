import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "../cn";
import { Icon } from "./Icon";
import { Label } from "./Label";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helper, error, required, id, className, children, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = `${selectId}-helper`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={helper || error ? helperId : undefined}
          className={cn(
            "h-10 w-full appearance-none rounded-field border bg-surface pl-3 pr-9 text-sm text-ink",
            "focus:outline-none focus:ring-2 focus:ring-ink/15 focus:border-ink/30",
            "disabled:bg-surface2 disabled:text-inkMuted",
            error ? "border-blushInk/50" : "border-border",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-inkMuted">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>
      {(helper || error) && (
        <span id={helperId} className={cn("text-xs", error ? "text-blushInk" : "text-inkMuted")}>
          {error ?? helper}
        </span>
      )}
    </div>
  );
});
