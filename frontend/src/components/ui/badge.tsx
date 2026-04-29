import * as React from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "blue" | "success" | "warning" | "destructive";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-studio-surface border-studio-border text-studio-subtle",
    blue: "bg-studio-blue/10 border-studio-blue/30 text-studio-blue",
    success: "bg-green-950 border-green-800 text-green-400",
    warning: "bg-yellow-950 border-yellow-800 text-yellow-400",
    destructive: "bg-red-950 border-red-800 text-red-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
