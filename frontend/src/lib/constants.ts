import type { StyleDefinition, AspectRatioDef } from "@/types";

export const STYLE_PRESETS: StyleDefinition[] = [
  { id: "none",          label: "No Style",       emoji: "✦",  color: "#333",    prompt_suffix: "" },
  { id: "photorealistic",label: "Photorealistic",  emoji: "📷", color: "#1a6b3a", prompt_suffix: "photorealistic, ultra detailed, 8k, professional photography" },
  { id: "digital_art",   label: "Digital Art",     emoji: "🎨", color: "#2d1b69", prompt_suffix: "digital art, concept art, artstation, highly detailed" },
  { id: "oil_painting",  label: "Oil Painting",    emoji: "🖼️", color: "#7c3a1e", prompt_suffix: "oil painting, classical, textured brushstrokes, masterpiece" },
  { id: "watercolor",    label: "Watercolor",      emoji: "💧", color: "#1e4d7c", prompt_suffix: "watercolor painting, soft edges, flowing colors, delicate washes" },
  { id: "anime",         label: "Anime",           emoji: "⛩️", color: "#6b1a6b", prompt_suffix: "anime style, manga, vibrant colors, cel shaded" },
  { id: "3d_render",     label: "3D Render",       emoji: "🧊", color: "#1a4a6b", prompt_suffix: "3D render, octane render, ray tracing, photorealistic 3D" },
  { id: "pixel_art",     label: "Pixel Art",       emoji: "👾", color: "#1a5c1a", prompt_suffix: "pixel art, 16-bit, retro game style, sprite art" },
  { id: "comic_book",    label: "Comic Book",      emoji: "💥", color: "#7c1a1a", prompt_suffix: "comic book style, bold outlines, halftone dots, ink drawing" },
  { id: "minimalist",    label: "Minimalist",      emoji: "◽", color: "#2a2a2a", prompt_suffix: "minimalist, clean lines, simple shapes, negative space" },
  { id: "cinematic",     label: "Cinematic",       emoji: "🎬", color: "#1a1a5c", prompt_suffix: "cinematic, film photography, dramatic lighting, anamorphic lens" },
  { id: "sketch",        label: "Sketch",          emoji: "✏️", color: "#3a3a3a", prompt_suffix: "pencil sketch, hand drawn, graphite, cross-hatching" },
  { id: "pop_art",       label: "Pop Art",         emoji: "🎭", color: "#7c6b1a", prompt_suffix: "pop art, Andy Warhol inspired, bold colors, flat design" },
  { id: "art_nouveau",   label: "Art Nouveau",     emoji: "🌿", color: "#1a5c3a", prompt_suffix: "art nouveau, ornate, flowing lines, natural forms, Mucha style" },
  { id: "cyberpunk",     label: "Cyberpunk",       emoji: "🌆", color: "#057dbc", prompt_suffix: "cyberpunk, neon lights, futuristic dystopia, synthwave" },
  { id: "fantasy",       label: "Fantasy",         emoji: "🐉", color: "#5c1a6b", prompt_suffix: "fantasy art, magical, ethereal, detailed illustration, epic" },
];

export const ASPECT_RATIOS: AspectRatioDef[] = [
  { value: "1:1",  label: "Square",    w: 1,  h: 1,   icon: "⬛" },
  { value: "16:9", label: "Landscape", w: 16, h: 9,   icon: "▬" },
  { value: "9:16", label: "Portrait",  w: 9,  h: 16,  icon: "▮" },
  { value: "4:3",  label: "Classic",   w: 4,  h: 3,   icon: "▭" },
  { value: "3:2",  label: "Photo",     w: 3,  h: 2,   icon: "▬" },
  { value: "2:3",  label: "Tall",      w: 2,  h: 3,   icon: "▮" },
];

export const QUALITY_LEVELS = [
  { value: "draft",    label: "Draft",    desc: "Fast, lower quality" },
  { value: "standard", label: "Standard", desc: "Balanced" },
  { value: "hd",       label: "HD",       desc: "High detail" },
  { value: "ultra",    label: "Ultra",    desc: "Highest quality, slowest" },
] as const;

export const OPERATIONS_LABELS: Record<string, string> = {
  generate:       "Generated",
  inpaint:        "Inpainted",
  outpaint:       "Outpainted",
  remove_bg:      "Background Removed",
  img2img:        "Image-to-Image",
  upload:         "Uploaded",
  variation:      "Variation",
  style_transfer: "Style Transfer",
};

export const STYLE_LABELS: Record<string, string> = Object.fromEntries(
  STYLE_PRESETS.map((s) => [s.id, s.label])
);

export const PROVIDERS = {
  openai:    { label: "OpenAI DALL-E", color: "#10a37f" },
  stability: { label: "Stability AI",  color: "#6b21a8" },
} as const;

export const DEFAULT_GENERATE_PARAMS = {
  style:        "none" as const,
  aspect_ratio: "1:1"  as const,
  quality:      "standard" as const,
  batch:        1,
};

export const MAX_BATCH = 4;
export const MAX_PROMPT_LENGTH = 4000;
export const MAX_NEGATIVE_PROMPT_LENGTH = 1000;

export const STORAGE_KEYS = {
  TOKEN:   "ai_studio_token",
  USER:    "ai_studio_user",
  HISTORY: "ai_studio_prompt_history",
} as const;

export const ROUTES = {
  HOME:        "/",
  LOGIN:       "/login",
  REGISTER:    "/register",
  STUDIO:      "/studio",
  EDITOR:      "/editor",
  GALLERY:     "/gallery",
  IMAGE:       (id: string) => `/gallery/${id}`,
  COLLECTIONS: "/collections",
  COLLECTION:  (id: string) => `/collections/${id}`,
} as const;