import { type LabelHTMLAttributes } from "react";

import { cn } from "../cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label
      className={cn("inline-flex items-center gap-1 text-xs font-medium text-inkSoft", className)}
      {...rest}
    >
      {children}
      {required && (
        <span className="text-blushInk" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}
