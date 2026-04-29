import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-studio-border bg-studio-surface text-studio-subtle">
          {icon}
        </div>
      )}
      <h3 className="mb-2 font-display text-lg text-white">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm font-mono text-xs text-studio-subtle">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
