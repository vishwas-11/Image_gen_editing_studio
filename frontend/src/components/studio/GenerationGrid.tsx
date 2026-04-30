"use client";

import { Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ImageRecord } from "@/types";

import ImageResultCard from "./ImageResultCard";

interface GenerationGridProps {
  images: ImageRecord[];
  isGenerating: boolean;
  batch: number;
  generationTime: number | null;
  onEdit?: (image: ImageRecord) => void;
  onVariations?: (image: ImageRecord) => void;
}

export function GenerationGrid({
  images,
  isGenerating,
  batch,
  generationTime,
  onEdit,
  onVariations,
}: GenerationGridProps) {
  const cols = batch <= 1 ? 1 : batch <= 2 ? 2 : batch <= 4 ? 2 : 3;
  const gridClassName =
    cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3";

  if (!isGenerating && images.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-studio-border bg-studio-surface/30">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-studio-border bg-studio-surface">
          <Sparkles size={22} className="text-studio-subtle" />
        </div>
        <p className="font-display text-sm text-white">
          Your generations will appear here
        </p>
        <p className="mt-1.5 font-mono text-xs text-studio-subtle">
          Write a prompt and press Generate
        </p>
      </div>
    );
  }

  const hasResults = images.length > 0;

  return (
    <div className="relative flex flex-col gap-3">
      {generationTime && !isGenerating && (
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-studio-border" />
          <span className="font-mono text-[10px] text-studio-subtle">
            {images.length} image{images.length !== 1 ? "s" : ""} -{" "}
            {generationTime.toFixed(1)}s
          </span>
          <div className="h-px flex-1 bg-studio-border" />
        </div>
      )}

      {isGenerating && hasResults && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 flex justify-center px-3",
            "pt-3",
          )}
        >
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="w-full max-w-xl rounded-xl border border-studio-border bg-black/85 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-studio-border bg-studio-surface">
                <Loader2 size={18} className="animate-spin text-studio-blue" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm text-white">
                  Generating images...
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-studio-subtle">
                  Rendering {batch} image{batch !== 1 ? "s" : ""}. Please keep this tab open.
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-studio-subtle">
                Working
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="loading-indeterminate-bar h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-studio-blue to-transparent" />
            </div>
          </div>
        </div>
      )}

      <div className={cn("relative", isGenerating && hasResults && "opacity-40 blur-[1px] pointer-events-none")}>
        {images.length > 0 ? (
          <div className={cn("grid gap-3", gridClassName)}>
            {images.map((image) => (
              <ImageResultCard
                key={image.id}
                image={image}
                onEdit={onEdit}
                onVariations={onVariations}
              />
            ))}
          </div>
        ) : isGenerating ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-studio-border bg-studio-surface/20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-studio-border bg-studio-surface">
              <Loader2 size={22} className="animate-spin text-studio-blue" />
            </div>
            <p className="font-display text-sm text-white">
              Generating your images
            </p>
            <p className="mt-1.5 font-mono text-xs text-studio-subtle">
              This can take a few moments depending on the prompt and batch size.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
