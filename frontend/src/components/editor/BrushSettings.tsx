"use client";

import { Eraser, Hand, Lasso, Paintbrush, RectangleHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Slider, Label } from "@/components/ui/index";
import { useEditorStore } from "@/store/galleryStore";
import type { EditorTool } from "@/types";

export function BrushSettings() {
  const {
    brushSize,
    editorTool,
    brushOpacity,
    softEdge,
    setBrushSize,
    setBrushTool,
    setEditorTool,
    setBrushOpacity,
    setSoftEdge,
  } = useEditorStore();

  const handleToolChange = (tool: EditorTool) => {
    setEditorTool(tool);
    if (tool === "brush" || tool === "eraser") {
      setBrushTool(tool);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">Editor tools</span>

      <div className="flex flex-col gap-2">
        <Label>Mask tool</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { tool: "brush", icon: Paintbrush, label: "Paint" },
              { tool: "eraser", icon: Eraser, label: "Erase" },
              { tool: "rectangle", icon: RectangleHorizontal, label: "Rect" },
              { tool: "lasso", icon: Lasso, label: "Lasso" },
              { tool: "pan", icon: Hand, label: "Pan" },
            ] as const
          ).map(({ tool, icon: Icon, label }) => (
            <button
              key={tool}
              onClick={() => handleToolChange(tool as EditorTool)}
              className={cn(
                "rounded-lg border px-2 py-2 font-mono text-xs transition-all",
                "flex items-center justify-center gap-1.5",
                editorTool === tool
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Opacity</Label>
          <span className="font-mono text-xs text-studio-blue">{Math.round(brushOpacity * 100)}%</span>
        </div>
        <Slider
          min={0.15}
          max={1}
          step={0.05}
          value={[brushOpacity]}
          onValueChange={([value]) => setBrushOpacity(value)}
        />
        <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
          Applies to paint, erase, rectangle, and lasso masks so the exported mask matches what you see.
        </p>
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
          <span className="text-red-400">Paint</span> the area you want to regenerate.
          Switch to <span className="text-blue-400">Erase</span> to trim the selection or clean up edges.
          Use <span className="text-white">Rect</span> or <span className="text-white">Lasso</span> for selection-style masks,
          and <span className="text-white">Pan</span> to drag the canvas around.
        </p>
      </div>
    </div>
  );
}

export default BrushSettings;
