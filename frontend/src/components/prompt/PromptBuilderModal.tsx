"use client";
import { useState } from "react";
import { X, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = {
  Subject:   ["A person", "A landscape", "An animal", "An object", "A building", "An abstract concept"],
  Setting:   ["in a forest", "in a city", "on a beach", "in space", "underwater", "in a desert", "in a studio"],
  Style:     ["photorealistic", "painterly", "cinematic", "minimalist", "surreal", "vintage", "futuristic"],
  Lighting:  ["golden hour", "dramatic shadows", "soft diffused", "neon glow", "candlelight", "overcast", "studio lit"],
  Camera:    ["wide angle", "macro", "aerial view", "eye level", "bokeh", "fisheye", "telephoto"],
  Colors:    ["warm tones", "cool tones", "monochrome", "vibrant", "muted pastels", "high contrast", "earth tones"],
  Mood:      ["peaceful", "dramatic", "mysterious", "joyful", "melancholic", "epic", "whimsical"],
};

type Category = keyof typeof CATEGORIES;

interface PromptBuilderModalProps {
  onUse: (prompt: string) => void;
  onClose: () => void;
}

export default function PromptBuilderModal({ onUse, onClose }: PromptBuilderModalProps) {
  const [selections, setSelections] = useState<Partial<Record<Category, string>>>({});

  const toggle = (cat: Category, val: string) =>
    setSelections((p) => ({ ...p, [cat]: p[cat] === val ? undefined : val }));

  const assembled = (Object.keys(CATEGORIES) as Category[])
    .map((cat) => selections[cat])
    .filter(Boolean)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-studio-border bg-black shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-studio-border">
          <div className="flex items-center gap-2">
            <Wand2 size={15} className="text-studio-blue" />
            <h2 className="font-display text-lg text-white">Prompt Builder</h2>
          </div>
          <button onClick={onClose} className="text-studio-subtle hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Categories */}
        <div className="p-5 flex flex-col gap-5">
          {(Object.entries(CATEGORIES) as [Category, string[]][]).map(([cat, options]) => (
            <div key={cat}>
              <span className="font-mono text-[10px] text-studio-subtle uppercase tracking-widest block mb-2">{cat}</span>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => toggle(cat, opt)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border font-mono text-xs transition-all duration-150",
                      selections[cat] === opt
                        ? "border-studio-blue bg-studio-blue/15 text-white"
                        : "border-studio-border bg-studio-surface text-studio-subtle hover:border-studio-blue/50 hover:text-white"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Preview + actions */}
        <div className="p-5 border-t border-studio-border flex flex-col gap-3">
          <div className="rounded-xl border border-studio-border bg-studio-surface p-3 min-h-[56px]">
            <p className="font-mono text-xs text-white leading-relaxed">
              {assembled || <span className="text-studio-subtle">Select options above to build your prompt…</span>}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setSelections({})}>Clear</Button>
            <Button size="sm" disabled={!assembled} onClick={() => { onUse(assembled); onClose(); }} className="gap-1.5">
              <Sparkles size={12} /> Use This Prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}