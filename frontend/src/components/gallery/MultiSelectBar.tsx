"use client";
import { Download, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectBarProps {
  count: number;
  total?: number;
  onSelectAll?: () => void;
  onClear?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  className?: string;
}

export default function MultiSelectBar({
  count,
  total,
  onSelectAll,
  onClear,
  onDelete,
  onDownload,
  className,
}: MultiSelectBarProps) {
  if (count <= 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-studio-blue/30 bg-studio-blue/10 px-4 py-3", className)}>
      <div>
        <p className="font-display text-sm text-white">{count} selected</p>
        {typeof total === "number" && (
          <p className="mt-1 font-mono text-[10px] text-studio-subtle">
            {count === total ? "All items selected" : `of ${total} items`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onSelectAll && (
          <ActionButton onClick={onSelectAll}>
            Select all
          </ActionButton>
        )}
        {onDownload && (
          <ActionButton onClick={onDownload}>
            <Download size={13} />
            Download
          </ActionButton>
        )}
        {onDelete && (
          <ActionButton onClick={onDelete} danger>
            <Trash2 size={13} />
            Delete
          </ActionButton>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 font-mono text-xs text-studio-subtle transition-colors hover:border-white/20 hover:text-white"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-mono text-xs transition-colors",
        danger
          ? "border-red-500/30 bg-red-500/10 text-red-200 hover:border-red-400/50 hover:bg-red-500/20"
          : "border-white/10 bg-black/40 text-white/80 hover:border-white/20 hover:bg-black/60 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
