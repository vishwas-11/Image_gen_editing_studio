"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ASPECT_RATIOS, OPERATIONS_LABELS, STYLE_PRESETS } from "@/lib/constants";
import type { GalleryFilters } from "@/types";

interface FilterPanelProps {
  filters: GalleryFilters;
  onChange: (patch: Partial<GalleryFilters>) => void;
  onClear?: () => void;
  className?: string;
}

export default function FilterPanel({ filters, onChange, onClear, className }: FilterPanelProps) {
  const operations = useMemo(
    () => Object.entries(OPERATIONS_LABELS).map(([value, label]) => ({ value, label })),
    []
  );

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border border-studio-border bg-studio-surface p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-studio-subtle">Filters</p>
          <p className="mt-1 font-display text-sm text-white">Narrow the gallery</p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[10px] uppercase tracking-wider text-studio-subtle transition-colors hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-3">
        <FilterSelect
          label="Style"
          value={filters.style ?? ""}
          onChange={(value) => onChange({ style: value || undefined })}
        >
          <option value="">All styles</option>
          {STYLE_PRESETS.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Operation"
          value={filters.operation ?? ""}
          onChange={(value) => onChange({ operation: value || undefined })}
        >
          <option value="">All operations</option>
          {operations.map((operation) => (
            <option key={operation.value} value={operation.value}>
              {operation.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Aspect Ratio"
          value={filters.aspect_ratio ?? ""}
          onChange={(value) => onChange({ aspect_ratio: value || undefined })}
        >
          <option value="">All ratios</option>
          {ASPECT_RATIOS.map((ratio) => (
            <option key={ratio.value} value={ratio.value}>
              {ratio.label}
            </option>
          ))}
        </FilterSelect>

        <label className="flex items-center justify-between rounded-lg border border-studio-border px-3 py-2">
          <span className="font-mono text-xs text-studio-subtle">Favorites only</span>
          <input
            type="checkbox"
            checked={Boolean(filters.is_favorite)}
            onChange={(e) => onChange({ is_favorite: e.target.checked ? true : undefined })}
            className="h-4 w-4 rounded border-studio-border bg-studio-surface"
          />
        </label>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-studio-subtle">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-studio-border bg-black px-3 py-2 text-sm text-white outline-none transition-colors focus:border-studio-blue/60"
      >
        {children}
      </select>
    </label>
  );
}
