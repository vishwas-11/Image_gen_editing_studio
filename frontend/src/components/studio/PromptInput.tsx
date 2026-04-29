"use client";
import { useState, useRef } from "react";
import { Sparkles, Dices, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Textarea, Label } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { promptApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MAX_PROMPT_LENGTH, MAX_NEGATIVE_PROMPT_LENGTH } from "@/lib/constants";
import type { StylePreset } from "@/types";

interface PromptInputProps {
  prompt: string;
  negativePrompt: string;
  showNegative: boolean;
  style: StylePreset;
  onPromptChange: (v: string) => void;
  onNegativeChange: (v: string) => void;
  onToggleNegative: () => void;
  onPromptEnhanced?: (v: string) => void;
  onSurpriseMe?: (prompt: string, style: StylePreset) => void;
}

export default function PromptInput({
  prompt, negativePrompt, showNegative, style,
  onPromptChange, onNegativeChange, onToggleNegative,
  onPromptEnhanced, onSurpriseMe,
}: PromptInputProps) {
  const [enhancing, setEnhancing] = useState(false);
  const [surprising, setSurprising] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEnhance = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt to enhance"); return; }
    setEnhancing(true);
    try {
      const res = await promptApi.enhance(prompt, style !== "none" ? style : undefined);
      onPromptEnhanced?.(res.enhanced);
      onPromptChange(res.enhanced);
      toast.success("Prompt enhanced!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnhancing(false);
    }
  };

  const handleSurprise = async () => {
    setSurprising(true);
    try {
      const res = await promptApi.random();
      onPromptChange(res.prompt);
      onSurpriseMe?.(res.prompt, res.suggested_style);
      toast.success("Surprise prompt loaded!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSurprising(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main prompt */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe the image you want to create..."
          maxLength={MAX_PROMPT_LENGTH}
          rows={4}
          className="resize-none text-base leading-relaxed pr-4 py-4 text-sm"
        />
        {/* Character count */}
        <span className={cn(
          "absolute bottom-2.5 right-3 font-mono text-[10px]",
          prompt.length > MAX_PROMPT_LENGTH * 0.9 ? "text-yellow-500" : "text-studio-subtle/40"
        )}>
          {prompt.length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnhance}
          loading={enhancing}
          disabled={!prompt.trim()}
          className="gap-1.5 transition-all duration-200 hover:-translate-y-px active:translate-y-0"
        >
          <Sparkles size={12} />
          Enhance
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSurprise}
          loading={surprising}
          className="gap-1.5 transition-all duration-200 hover:-translate-y-px active:translate-y-0"
        >
          <Dices size={12} />
          Surprise Me
        </Button>
        <div className="flex-1" />
        <button
          type="button"
          aria-expanded={showNegative}
          onClick={onToggleNegative}
          className="studio-chip flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-studio-subtle hover:text-white"
        >
          {showNegative ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Negative
        </button>
      </div>

      {/* Negative prompt — collapsible */}
      {showNegative && (
        <div className="flex flex-col gap-1.5 animate-slide-down">
          <Label htmlFor="negative">Negative Prompt</Label>
          <Textarea
            id="negative"
            value={negativePrompt}
            onChange={(e) => onNegativeChange(e.target.value)}
            placeholder="blurry, low quality, watermark, text, distorted..."
            maxLength={MAX_NEGATIVE_PROMPT_LENGTH}
            rows={2}
            className="text-xs"
          />
          <p className="font-mono text-[10px] text-studio-subtle/60">
            Describe what to exclude from the image
          </p>
        </div>
      )}
    </div>
  );
}
