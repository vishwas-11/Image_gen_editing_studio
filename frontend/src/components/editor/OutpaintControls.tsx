"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label, Slider, Textarea } from "@/components/ui/index";
import { useEditorStore } from "@/store/galleryStore";

interface OutpaintControlsProps {
  isLoading: boolean;
  onOutpaint: (directions: string[], pixels: number, prompt?: string) => void;
}

const DIRECTIONS = [
  { dir: "top" as const, label: "Top", icon: ArrowUp },
  { dir: "right" as const, label: "Right", icon: ArrowRight },
  { dir: "bottom" as const, label: "Bottom", icon: ArrowDown },
  { dir: "left" as const, label: "Left", icon: ArrowLeft },
];

export function OutpaintControls({ isLoading, onOutpaint }: OutpaintControlsProps) {
  const { outpaintDirections, outpaintPixels, toggleOutpaintDir, setOutpaintPixels } = useEditorStore();
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex flex-col gap-4 border-t border-studio-border p-4">
      <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">
        Outpaint
      </span>

      <div className="flex flex-col gap-1.5">
        <Label>Extend in direction</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {DIRECTIONS.map(({ dir, label, icon: Icon }) => {
            const active = outpaintDirections.includes(dir);
            return (
              <button
                key={dir}
                onClick={() => toggleOutpaintDir(dir)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-xs transition-all",
                  active
                    ? "border-studio-blue bg-studio-blue/10 text-white"
                    : "border-studio-border bg-studio-surface text-studio-subtle hover:text-white"
                )}
              >
                <Icon size={11} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Extend by</Label>
          <span className="font-mono text-xs text-studio-blue">{outpaintPixels}px</span>
        </div>
        <Slider
          min={64}
          max={512}
          step={64}
          value={[outpaintPixels]}
          onValueChange={([value]) => setOutpaintPixels(value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Prompt (optional)</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what should fill the extended area..."
          rows={2}
          className="text-xs"
        />
      </div>

      <Button
        onClick={() => onOutpaint(outpaintDirections, outpaintPixels, prompt || undefined)}
        loading={isLoading}
        disabled={outpaintDirections.length === 0}
        variant="outline"
        className="w-full gap-2"
      >
        Outpaint
      </Button>

      <div className="rounded-lg border border-studio-border bg-studio-surface/50 p-3">
        <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
          Choose one or more edges, then expand the canvas before running outpainting.
        </p>
      </div>
    </div>
  );
}

export default OutpaintControls;
