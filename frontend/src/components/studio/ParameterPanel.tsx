"use client";
import { cn } from "@/lib/utils";
import { ASPECT_RATIOS, QUALITY_LEVELS } from "@/lib/constants";
import { Slider, Label, Input } from "@/components/ui/index";
import { Dices } from "lucide-react";
import type { AspectRatio, Quality } from "@/types";

interface ParameterPanelProps {
  aspectRatio: AspectRatio;
  quality: Quality;
  batch: number;
  seed: string;
  onAspectRatio: (v: AspectRatio) => void;
  onQuality: (v: Quality) => void;
  onBatch: (v: number) => void;
  onSeed: (v: string) => void;
}

export default function ParameterPanel({
  aspectRatio, quality, batch, seed,
  onAspectRatio, onQuality, onBatch, onSeed,
}: ParameterPanelProps) {
  const qualityIdx = QUALITY_LEVELS.findIndex((q) => q.value === quality);
  const batchValues = [1, 2, 3, 4];

  return (
    <div className="flex flex-col gap-6">

      {/* Aspect Ratio */}
      <div className="flex flex-col gap-2">
        <Label>Aspect Ratio</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.value}
              type="button"
              aria-pressed={aspectRatio === ar.value}
              onClick={() => onAspectRatio(ar.value)}
              className={cn(
                "studio-chip flex flex-col items-center gap-1.5 rounded-lg border p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-blue/60",
                aspectRatio === ar.value
                  ? "border-studio-blue bg-studio-blue/10 text-white scale-[1.02] shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_8px_18px_rgba(5,125,188,0.08)]"
                  : "border-studio-border bg-studio-surface hover:border-studio-blue/50 text-studio-subtle hover:text-white"
              )}
            >
              {/* Visual preview */}
              <div className="flex items-center justify-center h-7">
                <div
                  className={cn(
                    "rounded-sm transition-all duration-200",
                    aspectRatio === ar.value ? "bg-studio-blue" : "bg-studio-subtle"
                  )}
                  style={{
                    width:  `${Math.round(20 * Math.min(ar.w / ar.h, 1.6))}px`,
                    height: `${Math.round(20 / Math.max(ar.w / ar.h, 0.625))}px`,
                    maxWidth: "28px",
                    maxHeight: "28px",
                  }}
                />
              </div>
              <span className="font-mono text-[10px]">{ar.value}</span>
              <span className="font-mono text-[9px] text-studio-subtle/70">{ar.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Quality</Label>
          <span className="font-mono text-xs text-studio-blue capitalize">{quality}</span>
        </div>
        <Slider
          min={0} max={3} step={1}
          value={[qualityIdx]}
          onValueChange={([v]) => onQuality(QUALITY_LEVELS[v].value)}
        />
        <div className="flex justify-between">
          {QUALITY_LEVELS.map((q) => (
            <span key={q.value} className={cn(
              "font-mono text-[9px] uppercase tracking-wider",
              q.value === quality ? "text-studio-blue" : "text-studio-subtle/50"
            )}>
              {q.label}
            </span>
          ))}
        </div>
      </div>

      {/* Batch count */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Batch Count</Label>
          <span className="font-mono text-xs text-studio-blue">{batch} image{batch > 1 ? "s" : ""}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {batchValues.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={batch === n}
              onClick={() => onBatch(n)}
              className={cn(
                "studio-chip rounded-lg border py-2 font-mono text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-blue/60",
                batch === n
                  ? "border-studio-blue bg-studio-blue/10 text-white scale-[1.03] shadow-[0_0_0_1px_rgba(59,130,246,0.12)]"
                  : "border-studio-border bg-studio-surface text-studio-subtle hover:border-studio-blue/50 hover:text-white"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Seed */}
      <div className="flex flex-col gap-2">
        <Label>Seed (optional)</Label>
        <div className="relative">
          <Input
            type="number"
            placeholder="Random"
            value={seed}
            onChange={(e) => onSeed(e.target.value)}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => onSeed(String(Math.floor(Math.random() * 999999999)))}
            title="Random seed"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-studio-subtle transition-all duration-200 hover:bg-studio-hover hover:text-white active:scale-95"
          >
            <Dices size={14} />
          </button>
        </div>
        <p className="font-mono text-[10px] text-studio-subtle/60">
          Same seed + same prompt = reproducible output
        </p>
      </div>
    </div>
  );
}
