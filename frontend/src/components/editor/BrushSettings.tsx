"use client";

import { Eraser, Paintbrush } from "lucide-react";

import { cn } from "@/lib/utils";
import { Slider, Label } from "@/components/ui/index";
import { useEditorStore } from "@/store/galleryStore";
import type { BrushTool } from "@/types";

export function BrushSettings() {
  const { brushSize, brushTool, softEdge, setBrushSize, setBrushTool, setSoftEdge } = useEditorStore();

  return (
    <div className="flex flex-col gap-5 p-4">
      <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">Brush</span>

      <div className="flex flex-col gap-2">
        <Label>Tool</Label>
        <div className="flex gap-1.5">
          {(
            [
              { tool: "brush", icon: Paintbrush, label: "Paint" },
              { tool: "eraser", icon: Eraser, label: "Erase" },
            ] as const
          ).map(({ tool, icon: Icon, label }) => (
            <button
              key={tool}
              onClick={() => setBrushTool(tool as BrushTool)}
              className={cn(
                "flex-1 rounded-lg border py-2 font-mono text-xs transition-all",
                "flex items-center justify-center gap-1.5",
                brushTool === tool
                  ? "border-studio-blue bg-studio-blue/10 text-white"
                  : "border-studio-border bg-studio-surface text-studio-subtle hover:text-white"
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Size</Label>
          <span className="font-mono text-xs text-studio-blue">{brushSize}px</span>
        </div>
        <Slider
          min={5}
          max={150}
          step={1}
          value={[brushSize]}
          onValueChange={([value]) => setBrushSize(value)}
        />
        <div className="flex justify-center">
          <div
            className="flex-shrink-0 rounded-full border border-red-500/40 bg-red-500/60 transition-all"
            style={{
              width: `${Math.min(brushSize, 60)}px`,
              height: `${Math.min(brushSize, 60)}px`,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Soft Edge</Label>
        <button
          onClick={() => setSoftEdge(!softEdge)}
          className={cn(
            "relative h-5 w-10 rounded-full border transition-all duration-200",
            softEdge ? "border-studio-blue bg-studio-blue" : "border-studio-border bg-studio-surface"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-200",
              softEdge ? "left-5" : "left-0.5"
            )}
          />
        </button>
      </div>

      <div className="rounded-lg border border-studio-border bg-studio-surface/50 p-3">
        <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
          <span className="text-red-400">Red overlay</span> marks the area to regenerate.
          Use erase mode to clean up mistakes.
        </p>
      </div>
    </div>
  );
}

export default BrushSettings;
