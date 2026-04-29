import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-studio-border bg-studio-surface px-3 py-2.5",
        "font-mono text-sm text-white placeholder:text-studio-subtle",
        "focus:outline-none focus:ring-1 focus:ring-studio-blue focus:border-studio-blue",
        "transition-colors duration-200 disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
