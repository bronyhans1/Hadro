import React from "react";
import { cn } from "@/lib/design-system/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  hint?: string;
  hintId?: string;
}

export function Label({ children, required, hint, hintId, className, ...props }: LabelProps) {
  return (
    <div className={cn("mb-1", className)}>
      <label className="ds-label block" {...props}>
        {children}
        {required ? <span className="ml-0.5 text-[var(--ds-color-danger)]">*</span> : null}
      </label>
      {hint ? <p id={hintId} className="ds-caption mt-0.5">{hint}</p> : null}
    </div>
  );
}
