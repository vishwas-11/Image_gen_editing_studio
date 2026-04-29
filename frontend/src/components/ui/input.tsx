import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-studio-border bg-studio-surface px-3 py-1",
        "font-mono text-sm text-white placeholder:text-studio-subtle",
        "focus:outline-none focus:ring-1 focus:ring-studio-blue focus:border-studio-blue",
        "transition-colors duration-200 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
