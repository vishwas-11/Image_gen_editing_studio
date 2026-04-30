"use client";
import { create } from "zustand";
import type { ImageRecord, StylePreset, AspectRatio, Quality } from "@/types";

const MAX_HISTORY = 30;

export interface PromptHistoryEntry {
  prompt: string;
  createdAt: number;
}

const emptyGenerationState = {
  prompt: "",
  negativePrompt: "",
  showNegative: true,
  style: "none" as StylePreset,
  aspectRatio: "1:1" as AspectRatio,
  quality: "standard" as Quality,
  batch: 1,
  seed: "",
  results: [] as ImageRecord[],
  isGenerating: false,
  generationTime: null as number | null,
  error: null as string | null,
};

interface GenerationState {
  // Prompt
  prompt: string;
  negativePrompt: string;
  showNegative: boolean;

  // Parameters
  style: StylePreset;
  aspectRatio: AspectRatio;
  quality: Quality;
  batch: number;
  seed: string;

  // Results
  results: ImageRecord[];
  isGenerating: boolean;
  generationTime: number | null;
  error: string | null;

  // Prompt history
  promptHistory: PromptHistoryEntry[];
  activeUserId: string | null;

  // Actions
  setUserContext: (userId: string | null) => void;
  setPromptHistory: (history: PromptHistoryEntry[]) => void;
  setPrompt: (p: string) => void;
  setNegativePrompt: (p: string) => void;
  toggleNegative: () => void;
  setStyle: (s: StylePreset) => void;
  setAspectRatio: (ar: AspectRatio) => void;
  setQuality: (q: Quality) => void;
  setBatch: (n: number) => void;
  setSeed: (s: string) => void;
  setResults: (images: ImageRecord[], time: number) => void;
  setGenerating: (v: boolean) => void;
  setError: (e: string | null) => void;
  addToHistory: (prompt: string) => void;
  clearResults: () => void;
  resetParams: () => void;
}

export const useGenerationStore = create<GenerationState>()((set, get) => ({
  ...emptyGenerationState,
  promptHistory: [],
  activeUserId: null,

  setUserContext: (userId) => {
    set((state) => {
      if (state.activeUserId === userId) {
        return state;
      }

      return {
        ...emptyGenerationState,
        promptHistory: [],
        activeUserId: userId,
      };
    });
  },

  setPromptHistory: (history) => set({ promptHistory: history }),

  setPrompt:        (p)   => set({ prompt: p }),
  setNegativePrompt:(p)   => set({ negativePrompt: p }),
  toggleNegative:   ()    => set((s) => ({ showNegative: !s.showNegative })),
  setStyle:         (s)   => set({ style: s }),
  setAspectRatio:   (ar)  => set({ aspectRatio: ar }),
  setQuality:       (q)   => set({ quality: q }),
  setBatch:         (n)   => set({ batch: n }),
  setSeed:          (s)   => set({ seed: s }),
  setGenerating:    (v)   => set({ isGenerating: v, error: null }),
  setError:         (e)   => set({ error: e, isGenerating: false }),
  clearResults:     ()    => set({ results: [] }),

  setResults: (images, time) => {
    set({ results: images, generationTime: time, isGenerating: false, error: null });
  },

  addToHistory: (prompt) => {
    if (!prompt.trim()) return;
    const history = [
      { prompt, createdAt: Date.now() },
      ...get().promptHistory.filter((entry) => entry.prompt !== prompt),
    ].slice(0, MAX_HISTORY);

    set({ promptHistory: history });
  },

  resetParams: () => set({
    style: "none", aspectRatio: "1:1", quality: "standard", batch: 1, seed: "",
  }),
}));
