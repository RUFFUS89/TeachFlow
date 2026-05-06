import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "../cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label htmlFor={inputId} className="inline-flex items-center gap-2 text-sm text-ink">
      <input
        ref={ref}
        type="checkbox"
        id={inputId}
        className={cn(
          "size-4 rounded border-border accent-ink focus:ring-2 focus:ring-ink/20",
          className,
        )}
        {...rest}
      />
      {label}
    </label>
  );
});
