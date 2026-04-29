import * as React from "react";

import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "font-mono text-xs uppercase tracking-wider text-studio-subtle",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
