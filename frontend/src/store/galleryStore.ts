"use client";
import { create } from "zustand";
import type { ImageRecord, GalleryFilters, Collection, BrushTool, StylePreset } from "@/types";

// ─── Gallery Store ─────────────────────────────────────────────────────────

interface GalleryState {
  images: ImageRecord[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  filters: GalleryFilters;
  selected: Set<string>;
  collections: Collection[];

  setImages: (images: ImageRecord[], total: number, totalPages: number) => void;
  appendImages: (images: ImageRecord[]) => void;
  setPage: (p: number) => void;
  setLoading: (v: boolean) => void;
  setFilters: (f: Partial<GalleryFilters>) => void;
  clearFilters: () => void;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  selectAll: () => void;
  updateImage: (id: string, patch: Partial<ImageRecord>) => void;
  removeImage: (id: string) => void;
  setCollections: (c: Collection[]) => void;
  addCollection: (c: Collection) => void;
  removeCollection: (id: string) => void;
}

export const useGalleryStore = create<GalleryState>()((set, get) => ({
  images: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  filters: { page: 1, page_size: 20 },
  selected: new Set(),
  collections: [],

  setImages:    (images, total, totalPages) => set({ images, total, totalPages }),
  appendImages: (images) => set((s) => ({ images: [...s.images, ...images] })),
  setPage:      (p) => set({ page: p }),
  setLoading:   (v) => set({ isLoading: v }),

  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f, page: 1 }, page: 1 })),

  clearFilters: () =>
    set({ filters: { page: 1, page_size: 20 }, page: 1 }),

  toggleSelected: (id) =>
    set((s) => {
      const next = new Set(s.selected);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selected: next };
    }),

  clearSelected: () => set({ selected: new Set() }),

  selectAll: () =>
    set((s) => ({ selected: new Set(s.images.map((i) => i.id)) })),

  updateImage: (id, patch) =>
    set((s) => ({
      images: s.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    })),

  removeImage: (id) =>
    set((s) => ({ images: s.images.filter((img) => img.id !== id), total: s.total - 1 })),

  setCollections: (c) => set({ collections: c }),
  addCollection:  (c) => set((s) => ({ collections: [c, ...s.collections] })),
  removeCollection: (id) =>
    set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
}));

// ─── Editor Store ──────────────────────────────────────────────────────────

interface EditorStoreState {
  sourceImageUrl: string | null;
  sourceImageId: string | null;
  maskImageUrl: string | null;
  brushSize: number;
  brushTool: BrushTool;
  softEdge: boolean;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  inpaintPrompt: string;
  img2imgPrompt: string;
  img2imgNegativePrompt: string;
  img2imgStrength: number;
  img2imgStyle: StylePreset;
  outpaintDirections: Array<"left" | "right" | "top" | "bottom">;
  outpaintPixels: number;

  setSourceImage: (url: string, id?: string) => void;
  setMaskImageUrl: (url: string | null) => void;
  setBrushSize: (n: number) => void;
  setBrushTool: (t: BrushTool) => void;
  setSoftEdge: (v: boolean) => void;
  setZoom: (n: number) => void;
  setCanUndo: (v: boolean) => void;
  setCanRedo: (v: boolean) => void;
  setInpaintPrompt: (p: string) => void;
  setImg2ImgPrompt: (p: string) => void;
  setImg2ImgNegativePrompt: (p: string) => void;
  setImg2ImgStrength: (n: number) => void;
  setImg2ImgStyle: (style: StylePreset) => void;
  toggleOutpaintDir: (dir: "left" | "right" | "top" | "bottom") => void;
  setOutpaintPixels: (n: number) => void;
  clearSourceImage: () => void;
  reset: () => void;
}

export const useEditorStore = create<EditorStoreState>()((set, get) => ({
  sourceImageUrl:    null,
  sourceImageId:     null,
  maskImageUrl:      null,
  brushSize:         30,
  brushTool:         "brush",
  softEdge:          true,
  zoom:              1,
  canUndo:           false,
  canRedo:           false,
  inpaintPrompt:     "",
  img2imgPrompt:     "",
  img2imgNegativePrompt: "",
  img2imgStrength:   0.75,
  img2imgStyle:      "none",
  outpaintDirections:[],
  outpaintPixels:    256,

  setSourceImage:    (url, id) => set({ sourceImageUrl: url, sourceImageId: id ?? null }),
  setMaskImageUrl:   (url)     => set({ maskImageUrl: url }),
  setBrushSize:      (n)       => set({ brushSize: n }),
  setBrushTool:      (t)       => set({ brushTool: t }),
  setSoftEdge:       (v)       => set({ softEdge: v }),
  setZoom:           (n)       => set({ zoom: n }),
  setCanUndo:        (v)       => set({ canUndo: v }),
  setCanRedo:        (v)       => set({ canRedo: v }),
  setInpaintPrompt:  (p)       => set({ inpaintPrompt: p }),
  setImg2ImgPrompt:  (p)       => set({ img2imgPrompt: p }),
  setImg2ImgNegativePrompt: (p) => set({ img2imgNegativePrompt: p }),
  setImg2ImgStrength:(n)       => set({ img2imgStrength: n }),
  setImg2ImgStyle:   (style)   => set({ img2imgStyle: style }),
  setOutpaintPixels: (n)       => set({ outpaintPixels: n }),

  clearSourceImage: () =>
    set({
      sourceImageUrl: null,
      sourceImageId: null,
      maskImageUrl: null,
      canUndo: false,
      canRedo: false,
      inpaintPrompt: "",
      img2imgPrompt: "",
      img2imgNegativePrompt: "",
      img2imgStrength: 0.75,
      img2imgStyle: "none",
      outpaintDirections: [],
      zoom: 1,
    }),

  toggleOutpaintDir: (dir) =>
    set((s) => ({
      outpaintDirections: s.outpaintDirections.includes(dir)
        ? s.outpaintDirections.filter((d) => d !== dir)
        : [...s.outpaintDirections, dir],
    })),

  reset: () => set({
    sourceImageUrl: null,
    sourceImageId: null,
    maskImageUrl: null,
    brushSize: 30,
    brushTool: "brush",
    softEdge: true,
    zoom: 1,
    canUndo: false,
    canRedo: false,
    inpaintPrompt: "",
    img2imgPrompt: "",
    img2imgNegativePrompt: "",
    img2imgStrength: 0.75,
    img2imgStyle: "none",
    outpaintDirections: [],
    outpaintPixels: 256,
  }),
}));
