"use client";
import { cn } from "@/lib/utils";
import { STYLE_PRESETS } from "@/lib/constants";
import type { StylePreset } from "@/types";

interface StyleSelectorProps {
  value: StylePreset;
  onChange: (s: StylePreset) => void;
}

export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">Style</span>
        <p className="text-[11px] leading-4 text-studio-subtle/75">
          Choose a visual direction before generating.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {STYLE_PRESETS.map((style) => (
          <button
            key={style.id}
            type="button"
            aria-pressed={value === style.id}
            onClick={() => onChange(style.id)}
            className={cn(
              "studio-chip relative flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2.5 text-left",
              "group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-blue/60",
              value === style.id
                ? "border-studio-blue bg-studio-blue/10 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_24px_rgba(5,125,188,0.12)] scale-[1.01]"
                : "border-studio-border bg-studio-surface hover:border-studio-blue/50 hover:bg-studio-hover text-studio-subtle hover:text-white"
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-sm transition-all duration-200",
                value === style.id
                  ? "shadow-[0_0_18px_rgba(5,125,188,0.18)]"
                  : "group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.04)]"
              )}
              style={{
                backgroundColor: `${style.color}26`,
                borderColor: `${style.color}66`,
              }}
              aria-hidden="true"
            >
              <span className="leading-none">{style.emoji}</span>
            </div>
            <div className="min-w-0 flex-1 transition-all duration-200">
              <span className={cn(
                "block font-mono text-[13px] leading-tight transition-transform duration-200",
                value === style.id && "translate-x-0.5"
              )}>
                {style.label}
              </span>
              <span className={cn(
                "mt-0.5 block text-[11px] leading-4 transition-colors duration-200",
                value === style.id ? "text-studio-blue/90" : "text-studio-subtle/70"
              )}>
                {style.id === "none" ? "Default output" : "Preset prompt suffix"}
              </span>
            </div>
            {value === style.id && (
              <div className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-studio-blue animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
