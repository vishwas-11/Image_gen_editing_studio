"use client";

import { Sparkles } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-3">
      {generationTime && (
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-studio-border" />
          <span className="font-mono text-[10px] text-studio-subtle">
            {images.length} image{images.length !== 1 ? "s" : ""} -{" "}
            {generationTime.toFixed(1)}s
          </span>
          <div className="h-px flex-1 bg-studio-border" />
        </div>
      )}

      <div className="relative">
        {isGenerating && (
          <div className={cn("grid gap-3", gridClassName)}>
            {Array.from({ length: batch }).map((_, index) => (
              <div key={index} className="skeleton aspect-square rounded-lg" />
            ))}
          </div>
        )}

        {!isGenerating && images.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
