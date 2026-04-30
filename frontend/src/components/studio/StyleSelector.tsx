"use client";
import { STYLE_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StylePreset } from "@/types";

interface StyleSelectorProps {
  value: StylePreset;
  onChange: (s: StylePreset) => void;
}

type StyleMeta = {
  tagline: string;
  chips: [string, string, string];
  detail: string;
};

const STYLE_META: Record<StylePreset, StyleMeta> = {
  none: {
    tagline: "Clean baseline output",
    chips: ["neutral", "flexible", "unlocked"],
    detail: "Start blank and keep the model undecorated.",
  },
  photorealistic: {
    tagline: "Lens-driven realism",
    chips: ["camera", "light", "detail"],
    detail: "Sharper highlights, realistic material response, and crisp depth.",
  },
  digital_art: {
    tagline: "Painterly concept art",
    chips: ["concept", "color", "render"],
    detail: "Strong shapes, stylized shading, and vivid illustrative energy.",
  },
  oil_painting: {
    tagline: "Thick, textured brushwork",
    chips: ["canvas", "layers", "texture"],
    detail: "Rich pigment, visible strokes, and a gallery-like finish.",
  },
  watercolor: {
    tagline: "Soft pigment blooms",
    chips: ["wash", "paper", "flow"],
    detail: "Light edges, transparent color, and airy transitions.",
  },
  anime: {
    tagline: "Crisp animated framing",
    chips: ["cel", "dynamic", "clean"],
    detail: "Graphic silhouettes, vibrant color, and expressive timing.",
  },
  "3d_render": {
    tagline: "Polished synthetic surfaces",
    chips: ["pbr", "lighting", "depth"],
    detail: "Glossy materials, shadow separation, and studio-grade rendering.",
  },
  pixel_art: {
    tagline: "Retro blocky charm",
    chips: ["grid", "sprite", "8-bit"],
    detail: "Low-resolution styling with crisp shapes and nostalgic color.",
  },
  comic_book: {
    tagline: "Ink, punch, and halftones",
    chips: ["bold", "ink", "motion"],
    detail: "Graphic outlines and dramatic contrast with printed energy.",
  },
  minimalist: {
    tagline: "Quiet negative space",
    chips: ["simple", "calm", "focused"],
    detail: "Reduced forms, restrained detail, and a cleaner visual rhythm.",
  },
  cinematic: {
    tagline: "Frame like a film still",
    chips: ["wide", "moody", "scope"],
    detail: "Dramatic lighting, deep contrast, and a movie-poster feel.",
  },
  sketch: {
    tagline: "Loose hand-drawn lines",
    chips: ["graphite", "draft", "gesture"],
    detail: "Visible construction marks, expressive edges, and raw motion.",
  },
  pop_art: {
    tagline: "Graphic, loud, and playful",
    chips: ["bold", "flat", "iconic"],
    detail: "High-contrast color blocks with a poster-like punch.",
  },
  art_nouveau: {
    tagline: "Decorative flowing forms",
    chips: ["ornate", "curve", "floral"],
    detail: "Elegant linework, organic framing, and ornate balance.",
  },
  cyberpunk: {
    tagline: "Neon-lit futurism",
    chips: ["glow", "city", "signal"],
    detail: "Electric contrast, saturated accents, and high-tech atmosphere.",
  },
  fantasy: {
    tagline: "Mythic and atmospheric",
    chips: ["epic", "magic", "realm"],
    detail: "Dreamlike scale, luminous accents, and storybook grandeur.",
  },
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "").trim();
  const expanded =
    normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized;

  if (expanded.length !== 6) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-studio-border bg-studio-surface/70 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">Style profiles</span>
            <p className="text-[11px] leading-4 text-studio-subtle/75">
              Visual presets now show a preview cue, not just a label.
            </p>
          </div>
          <div className="rounded-full border border-studio-border bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-studio-subtle">
            {STYLE_PRESETS.length} looks
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {STYLE_PRESETS.map((style) => (
          <button
            key={style.id}
            type="button"
            aria-pressed={value === style.id}
            onClick={() => onChange(style.id)}
            className={cn(
              "studio-chip group relative overflow-hidden rounded-2xl border p-2 text-left",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-studio-blue/60",
              value === style.id
                ? "border-studio-blue/70 bg-studio-blue/10 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.16),0_14px_28px_rgba(5,125,188,0.14)]"
                : "border-studio-border bg-studio-surface hover:border-studio-blue/40 hover:bg-studio-hover text-studio-subtle hover:text-white"
            )}
          >
            <div
              className={cn(
                "relative min-h-[9.25rem] overflow-hidden rounded-[1.05rem] border transition-all duration-300",
                value === style.id
                  ? "shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
                  : "group-hover:border-studio-blue/30"
              )}
              style={{
                backgroundImage: [
                  `radial-gradient(circle at 18% 14%, ${hexToRgba(style.color, value === style.id ? 0.55 : 0.38)} 0%, transparent 38%)`,
                  `radial-gradient(circle at 82% 8%, ${hexToRgba(style.color, 0.28)} 0%, transparent 24%)`,
                  `linear-gradient(135deg, ${hexToRgba(style.color, value === style.id ? 0.9 : 0.72)} 0%, rgba(6, 6, 8, 0.96) 68%)`,
                ].join(", "),
              }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_24%,transparent_72%,rgba(0,0,0,0.36))]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />

              <div className="absolute left-3 top-3 flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/45 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">
                  {style.id === "none" ? "baseline" : "preset"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
                  {value === style.id ? "selected" : style.emoji}
                </span>
              </div>

              <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/65">
                {style.id.replaceAll("_", " ")}
              </div>

              <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2">
                <div
                  className={cn(
                    "absolute inset-0 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-[1px]",
                    value === style.id ? "rotate-6 shadow-[0_0_22px_rgba(255,255,255,0.08)]" : "-rotate-3"
                  )}
                  style={{
                    boxShadow: `inset 0 0 0 1px ${hexToRgba(style.color, 0.25)}`,
                  }}
                />
                <div
                  className="absolute left-3 top-3 h-6 w-6 rounded-full blur-[1px]"
                  style={{ backgroundColor: hexToRgba(style.color, 0.88) }}
                />
                <div
                  className="absolute bottom-3 right-3 h-3 w-12 rounded-full"
                  style={{ backgroundColor: hexToRgba(style.color, 0.55) }}
                />
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13px] uppercase tracking-[0.18em] text-white">
                    {style.label}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/72">
                    {STYLE_META[style.id].tagline}
                  </p>
                </div>
                <div
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em]",
                    value === style.id
                      ? "border-studio-blue/40 bg-studio-blue/15 text-white"
                      : "border-white/10 bg-black/45 text-white/70"
                  )}
                >
                  {style.id === "none" ? "default" : "prompt suffix"}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 px-1 pb-1">
              <p
                className={cn(
                  "min-w-0 flex-1 font-mono text-[10px] leading-4",
                  value === style.id ? "text-studio-blue/90" : "text-studio-subtle/70"
                )}
              >
                {STYLE_META[style.id].detail}
              </p>
              {value === style.id && (
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-studio-blue shadow-[0_0_12px_rgba(5,125,188,0.8)]" />
              )}
            </div>

            <div className="flex flex-wrap gap-1 px-1 pb-0.5">
              {STYLE_META[style.id].chips.map((chip) => (
                <span
                  key={chip}
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]",
                    value === style.id
                      ? "border-studio-blue/25 bg-studio-blue/10 text-white"
                      : "border-white/8 bg-black/35 text-white/60"
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-300",
                value === style.id ? "opacity-100" : "opacity-60"
              )}
              style={{ backgroundColor: hexToRgba(style.color, value === style.id ? 0.9 : 0.5) }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
