"use client";
import { cn } from "@/lib/utils";
import { ASPECT_RATIOS, QUALITY_LEVELS } from "@/lib/constants";
import { Label, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/index";
import { Dices, Info, Sparkles } from "lucide-react";
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
  const qualityIdx = Math.max(0, QUALITY_LEVELS.findIndex((q) => q.value === quality));
  const selectedQuality = QUALITY_LEVELS[qualityIdx] ?? QUALITY_LEVELS[1];
  const batchValues = [1, 2, 3, 4];

  return (
    <TooltipProvider delayDuration={180}>
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-studio-blue/20 bg-studio-blue/10 p-3">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-studio-blue" />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-studio-blue">
                Quick guide
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/90">
                Quality changes speed and detail. Seed locks repeatable results. Leave the seed blank for a fresh random start.
              </p>
            </div>
          </div>
        </div>

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
        <div className="rounded-xl border border-studio-border bg-studio-surface/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Label>Quality</Label>
                <span className="whitespace-nowrap rounded-full border border-studio-blue/20 bg-studio-blue/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-studio-blue">
                  {selectedQuality.label}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-studio-subtle">
                Lower settings are quicker for experimentation. Higher settings take longer but can add more detail.
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="What quality means"
                  className="mt-0.5 rounded-full border border-studio-border bg-black/60 p-1.5 text-studio-subtle transition-colors hover:border-studio-blue/50 hover:text-white"
                >
                  <Info size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-[220px] space-y-1.5">
                  <p className="font-medium text-white">Quality controls speed vs detail.</p>
                  <p className="text-studio-subtle">
                    Draft is fastest, Standard is balanced, HD is sharper, and Ultra gives the most detail.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-4 rounded-xl border border-studio-border bg-black/35 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-studio-subtle">
                Quality meter
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-studio-subtle">
                Faster <span className="mx-1 text-studio-border">|</span> Slower
              </span>
            </div>
            <div className="relative h-9">
              <div className="absolute left-1 right-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-studio-border/80" />
              <div
                className="absolute left-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-studio-blue via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${(qualityIdx / 3) * 100}%` }}
              />
              <div className="relative grid h-full grid-cols-4">
                {QUALITY_LEVELS.map((q, idx) => {
                  const active = idx === qualityIdx;
                  return (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => onQuality(q.value)}
                      aria-pressed={active}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 rounded-lg outline-none transition-all",
                        active ? "text-white" : "text-studio-subtle hover:text-white"
                      )}
                    >
                      <span
                        className={cn(
                          "relative z-10 h-3.5 w-3.5 rounded-full border-2 transition-all",
                          active
                            ? "border-studio-blue bg-studio-blue shadow-[0_0_0_6px_rgba(59,130,246,0.12)]"
                            : "border-studio-border bg-black"
                        )}
                      />
                      <span className="sr-only">{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
            {QUALITY_LEVELS.map((q) => {
              const active = q.value === quality;
              return (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => onQuality(q.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-blue/60",
                    active
                      ? "border-studio-blue bg-studio-blue/10 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
                      : "border-studio-border bg-studio-surface/40 text-studio-subtle hover:border-studio-blue/50 hover:text-white"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider">{q.label}</span>
                    {active && <span className="whitespace-nowrap font-mono text-[10px] text-studio-blue">Selected</span>}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">{q.desc}</p>
                </button>
              );
            })}
          </div>
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
          <p className="font-mono text-[10px] text-studio-subtle/60">
            Higher batches generate more options at once.
          </p>
        </div>

        {/* Seed */}
        <div className="rounded-xl border border-studio-border bg-studio-surface/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Label>Seed</Label>
                <span className="rounded-full border border-studio-border bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-studio-subtle">
                  Optional
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-studio-subtle">
                Use the same seed to recreate a similar result later. Leave it blank if you want the model to choose randomly.
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Seed help"
                  className="mt-0.5 rounded-full border border-studio-border bg-black/60 p-1.5 text-studio-subtle transition-colors hover:border-studio-blue/50 hover:text-white"
                >
                  <Info size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-[220px] space-y-1.5">
                  <p className="font-medium text-white">Seed is a repeatability control.</p>
                  <p className="text-studio-subtle">
                    If you keep the prompt and seed the same, you can usually get a very similar image again.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-3 relative">
            <Input
              type="number"
              placeholder="Leave blank for random"
              value={seed}
              onChange={(e) => onSeed(e.target.value)}
              className="pr-10 bg-black/40"
            />
            <button
              type="button"
              onClick={() => onSeed(String(Math.floor(Math.random() * 999999999)))}
              title="Generate a random seed"
              aria-label="Generate a random seed"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-studio-subtle transition-all duration-200 hover:bg-studio-hover hover:text-white active:scale-95"
            >
              <Dices size={14} />
            </button>
          </div>
          <div className="mt-3 rounded-lg border border-studio-border/70 bg-black/40 px-3 py-2">
            <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
              Tip: write down a seed you like so you can revisit the same look later.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
