// ─── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Images ───────────────────────────────────────────────────────────────

export type StylePreset =
  | "none" | "photorealistic" | "digital_art" | "oil_painting"
  | "watercolor" | "anime" | "3d_render" | "pixel_art"
  | "comic_book" | "minimalist" | "cinematic" | "sketch"
  | "pop_art" | "art_nouveau" | "cyberpunk" | "fantasy";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "2:3";
export type Quality     = "draft" | "standard" | "hd" | "ultra";
export type Operation   = "generate" | "inpaint" | "outpaint" | "remove_bg" | "img2img" | "upload" | "variation" | "style_transfer";
export type DownloadFormat    = "png" | "jpeg" | "webp";
export type DownloadResolution = "original" | "2k" | "1k" | "thumbnail";

export interface ImageRecord {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  prompt: string | null;
  negative_prompt: string | null;
  style: string | null;
  aspect_ratio: string | null;
  quality: string | null;
  seed: string | null;
  provider: string | null;
  operation: Operation | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  format: string | null;
  is_favorite: boolean;
  tags: string | null;
  created_at: string;
}

export interface GeneratedImage extends ImageRecord {
  operation: "generate";
}

// ─── API Requests ─────────────────────────────────────────────────────────

export interface GenerateRequest {
  prompt: string;
  negative_prompt?: string;
  style?: StylePreset;
  aspect_ratio?: AspectRatio;
  quality?: Quality;
  batch?: number;
  seed?: number;
}

export interface InpaintRequest {
  original_image_url: string;
  mask_image_url: string;
  prompt: string;
  negative_prompt?: string;
  style?: StylePreset;
}

export interface OutpaintRequest {
  original_image_url: string;
  prompt?: string;
  directions: Array<"left" | "right" | "top" | "bottom">;
  pixels?: number;
}

export interface RemoveBgRequest {
  image_url: string;
  replacement_type: "transparent" | "color" | "prompt";
  replacement_color?: string;
  replacement_prompt?: string;
}

export interface Img2ImgRequest {
  source_image_url: string;
  prompt: string;
  negative_prompt?: string;
  style?: StylePreset;
  strength?: number;
  aspect_ratio?: AspectRatio;
  quality?: Quality;
}

export interface VariationRequest {
  source_image_url: string;
  prompt?: string;
  negative_prompt?: string;
  style?: StylePreset;
  count?: number;
}

// ─── API Responses ────────────────────────────────────────────────────────

export interface GenerationResponse {
  images: ImageRecord[];
  prompt_used: string;
  generation_time_seconds: number;
}

export interface ImageListResponse {
  items: ImageRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UploadResponse {
  image_url: string;
  thumbnail_url: string | null;
  cloudinary_public_id: string;
  width: number;
  height: number;
  format: string;
  file_size: number;
}

// ─── Gallery Filters ──────────────────────────────────────────────────────

export interface GalleryFilters {
  search?: string;
  style?: string;
  operation?: string;
  is_favorite?: boolean;
  aspect_ratio?: string;
  page?: number;
  page_size?: number;
}

// ─── Collections ──────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  image_count: number;
}

// ─── Prompt ───────────────────────────────────────────────────────────────

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  example: string;
  tags: string[];
}

export interface RandomPromptResponse {
  prompt: string;
  suggested_style: StylePreset;
  suggested_aspect_ratio: AspectRatio;
}

export interface PromptEnhanceResponse {
  original: string;
  enhanced: string;
  style_applied: string | null;
}

export interface PromptHistoryItem {
  prompt: string;
  created_at: string;
}

// ─── UI State ─────────────────────────────────────────────────────────────

export interface StyleDefinition {
  id: StylePreset;
  label: string;
  emoji: string;
  color: string;
  prompt_suffix: string;
}

export interface AspectRatioDef {
  value: AspectRatio;
  label: string;
  w: number;
  h: number;
  icon: string;
}

export type BrushTool = "brush" | "eraser";
export type EditorTool = "brush" | "eraser" | "rectangle" | "lasso" | "pan";

export interface EditorState {
  sourceImageUrl: string | null;
  maskImageUrl: string | null;
  brushSize: number;
  brushTool: BrushTool;
  editorTool: EditorTool;
  brushOpacity: number;
  softEdge: boolean;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
}
