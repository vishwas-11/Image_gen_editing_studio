"use client";

import { useCallback } from "react";
import { Blend, ImagePlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label, Separator, Slider, Textarea } from "@/components/ui/index";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageDropzone } from "@/components/shared/index";
import { STYLE_PRESETS } from "@/lib/constants";
import { useEditorStore } from "@/store/galleryStore";
import type { StylePreset } from "@/types";

interface ImageToImagePanelProps {
  isLoading: boolean;
  onUploadReference: (file: File) => Promise<void> | void;
  onRun: (payload: {
    prompt: string;
    negativePrompt?: string;
    style: StylePreset;
    strength: number;
  }) => void;
}

export function ImageToImagePanel({
  isLoading,
  onUploadReference,
  onRun,
}: ImageToImagePanelProps) {
  const {
    sourceImageUrl,
    sourceImageId,
    img2imgPrompt,
    img2imgNegativePrompt,
    img2imgStrength,
    img2imgStyle,
    setImg2ImgPrompt,
    setImg2ImgNegativePrompt,
    setImg2ImgStrength,
    setImg2ImgStyle,
  } = useEditorStore();

  const handlePromptRun = useCallback(() => {
    onRun({
      prompt: img2imgPrompt,
      negativePrompt: img2imgNegativePrompt.trim() || undefined,
      style: img2imgStyle as StylePreset,
      strength: img2imgStrength,
    });
  }, [img2imgNegativePrompt, img2imgPrompt, img2imgStrength, img2imgStyle, onRun]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Blend size={11} className="text-studio-subtle" />
        <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">
          Image-to-Image
        </span>
      </div>

      <div className="rounded-lg border border-studio-border bg-studio-surface/50 p-3">
        <div className="space-y-1.5">
          <p className="font-mono text-xs text-white">
            {sourceImageUrl ? "Reference image loaded" : "Upload a reference image"}
          </p>
          <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
            {sourceImageUrl
              ? sourceImageId
                ? `Using image ID ${sourceImageId} as the reference source.`
                : "Using the current editor image as the reference source."
              : "Add a source image first, then tune the strength to control how much the result can drift."}
          </p>
        </div>

        <div className="mt-3">
          <ImageDropzone
            onFile={(file) => void onUploadReference(file)}
            label={sourceImageUrl ? "Replace the reference image" : "Drop a reference image here"}
            className="py-8"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Style</Label>
        <Select value={img2imgStyle} onValueChange={(value) => setImg2ImgStyle(value as StylePreset)}>
          <SelectTrigger className="w-full border-studio-border bg-studio-surface px-3 py-2 font-mono text-xs text-white hover:border-studio-blue/50">
            <SelectValue placeholder="Select a style..." />
          </SelectTrigger>
          <SelectContent className="border-studio-border bg-black text-white">
            {STYLE_PRESETS.map((preset) => (
              <SelectItem
                key={preset.id}
                value={preset.id}
                className="font-mono text-xs focus:bg-studio-blue focus:text-white"
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Prompt</Label>
        <Textarea
          value={img2imgPrompt}
          onChange={(e) => setImg2ImgPrompt(e.target.value)}
          placeholder="e.g. transform it into a cinematic neon city poster..."
          rows={3}
          className="text-xs"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Negative prompt</Label>
        <Textarea
          value={img2imgNegativePrompt}
          onChange={(e) => setImg2ImgNegativePrompt(e.target.value)}
          placeholder="Optional: things to avoid in the result..."
          rows={2}
          className="text-xs"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Strength</Label>
          <span className="font-mono text-xs text-studio-blue">{Math.round(img2imgStrength * 100)}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Math.round(img2imgStrength * 100)]}
          onValueChange={([value]) => setImg2ImgStrength(value / 100)}
        />
        <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
          Lower values stay closer to the reference image. Higher values allow bigger changes.
        </p>
      </div>

      <Button
        onClick={handlePromptRun}
        loading={isLoading}
        disabled={!sourceImageUrl || !img2imgPrompt.trim()}
        className="w-full gap-2"
      >
        <Sparkles size={13} />
        Run Image-to-Image
      </Button>

      {!sourceImageUrl && (
        <p className="text-center font-mono text-[10px] text-studio-subtle">
          Upload or load a reference image to enable this mode
        </p>
      )}

      <Separator />

      <div className="rounded-lg border border-studio-border bg-studio-surface/50 p-3">
        <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
          Image-to-image keeps the current image as a visual guide while the prompt and strength control the amount of change.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-studio-border bg-studio-surface/30 px-3 py-2">
        <ImagePlus size={12} className="text-studio-subtle" />
        <p className="font-mono text-[10px] leading-relaxed text-studio-subtle">
          Loading a new reference image replaces the current editor source.
        </p>
      </div>
    </div>
  );
}

export default ImageToImagePanel;
