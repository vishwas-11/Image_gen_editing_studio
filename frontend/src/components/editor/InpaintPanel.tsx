"use client";

import { useState } from "react";
import { Layers, Sparkles, Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label, Separator, Textarea } from "@/components/ui/index";
import { useEditorStore } from "@/store/galleryStore";
import { STYLE_PRESETS } from "@/lib/constants";
import type { StylePreset } from "@/types";

interface InpaintPanelProps {
  hasMask: boolean;
  isLoading: boolean;
  onInpaint: (prompt: string, style: StylePreset) => void;
  onRemoveBg: () => void;
  onStyleTransfer: (style: StylePreset) => void;
}

export function InpaintPanel({
  hasMask,
  isLoading,
  onInpaint,
  onRemoveBg,
  onStyleTransfer,
}: InpaintPanelProps) {
  const { inpaintPrompt, setInpaintPrompt } = useEditorStore();
  const [style, setStyle] = useState<StylePreset>("none");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Wand2 size={11} className="text-studio-subtle" />
        <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">
          Inpaint
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Style</Label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as StylePreset)}
          className={cn(
            "w-full rounded border border-studio-border bg-studio-surface px-2.5 py-2",
            "font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-studio-blue"
          )}
        >
          {STYLE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Replace masked area with...</Label>
        <Textarea
          value={inpaintPrompt}
          onChange={(e) => setInpaintPrompt(e.target.value)}
          placeholder="e.g. a golden crown, a forest background..."
          rows={3}
          className="text-xs"
        />
      </div>

      <Button
        onClick={() => onInpaint(inpaintPrompt, style)}
        loading={isLoading}
        disabled={!hasMask || !inpaintPrompt.trim()}
        className="w-full gap-2"
      >
        <Sparkles size={13} />
        Inpaint
      </Button>

      {!hasMask && (
        <p className="text-center font-mono text-[10px] text-studio-subtle">
          Paint a mask on the image first
        </p>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-studio-subtle">
          <Layers size={11} /> Background
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemoveBg}
          loading={isLoading}
          className="w-full"
        >
          Remove Background
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">
          Style Transfer
        </span>
        <select
          onChange={(e) => e.target.value && onStyleTransfer(e.target.value as StylePreset)}
          defaultValue=""
          className={cn(
            "w-full rounded border border-studio-border bg-studio-surface px-2.5 py-2",
            "font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-studio-blue"
          )}
        >
          <option value="" disabled>
            Select style to apply...
          </option>
          {STYLE_PRESETS.filter((preset) => preset.id !== "none").map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-studio-border bg-studio-surface/50 p-3">
        <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
          {hasMask
            ? "Mask detected. You can send this prompt for inpainting."
            : "Paint a mask on the canvas first, then write the prompt here."}
        </p>
      </div>
    </div>
  );
}

export default InpaintPanel;
