"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/shared/index";
import { Separator } from "@/components/ui/index";
import PromptInput from "@/components/studio/PromptInput";
import StyleSelector from "@/components/studio/StyleSelector";
import ParameterPanel from "@/components/studio/ParameterPanel";
import { GenerationGrid } from "@/components/studio/GenerationGrid";
import { PromptHistoryStrip } from "@/components/studio/PromptHistoryStrip";
import { useGenerationStore } from "@/store/generationStore";
import { generateApi } from "@/lib/api/generate";
import { promptApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { useEditorStore } from "@/store/galleryStore";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";
import type { ImageRecord, StylePreset } from "@/types";

export default function StudioPage() {
  return (
    <AuthGuard>
      <StudioContent />
    </AuthGuard>
  );
}

function StudioContent() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const store = useGenerationStore();
  const setUserContext = useGenerationStore((state) => state.setUserContext);
  const setPromptHistory = useGenerationStore((state) => state.setPromptHistory);
  const editorStore = useEditorStore();

  useEffect(() => {
    setUserContext(userId);
  }, [setUserContext, userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const history = await promptApi.history();
        if (cancelled) return;
        setPromptHistory(
          history.map((entry) => ({
            prompt: entry.prompt,
            createdAt: new Date(entry.created_at).getTime(),
          })),
        );
      } catch {
        if (!cancelled) {
          setPromptHistory([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setPromptHistory, userId]);

  const handleGenerate = async () => {
    if (!store.prompt.trim()) { toast.error("Enter a prompt"); return; }
    store.setGenerating(true);
    try {
      const res = await generateApi.generate({
        prompt:          store.prompt,
        negative_prompt: store.negativePrompt || undefined,
        style:           store.style,
        aspect_ratio:    store.aspectRatio,
        quality:         store.quality,
        batch:           store.batch,
        seed:            store.seed ? parseInt(store.seed) : undefined,
      });
      store.setResults(res.images, res.generation_time_seconds);
      store.addToHistory(store.prompt);
      toast.success(`Generated ${res.images.length} image${res.images.length > 1 ? "s" : ""} in ${res.generation_time_seconds.toFixed(1)}s`);
    } catch (err) {
      store.setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    }
  };

  const handleEdit = (image: ImageRecord) => {
    editorStore.setSourceImage(image.image_url, image.id);
    router.push(ROUTES.EDITOR);
  };

  const handleVariations = async (image: ImageRecord) => {
    if (!image.image_url) return;
    store.setGenerating(true);
    try {
      const res = await generateApi.generateVariations({
        source_image_url: image.image_url,
        prompt: image.prompt ?? undefined,
        style: store.style,
        count: store.batch,
      });
      store.setResults(res.images, res.generation_time_seconds);
      if (image.prompt) {
        store.addToHistory(image.prompt);
      }
      toast.success(`Generated ${res.images.length} variations`);
    } catch (err) {
      store.setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    }
  };

  const handleSurprise = (_prompt: string, style: StylePreset) => {
    store.setStyle(style);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Left Sidebar: Styles ─────────────────────────────────────────── */}
      <aside className="studio-scrollbar w-72 flex-shrink-0 border-r border-studio-border bg-black overflow-y-auto xl:w-80">
        <div className="p-4">
          <StyleSelector value={store.style} onChange={store.setStyle} />
        </div>
      </aside>

      {/* ── Center: Prompt + Results ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-black">

        {/* Prompt area */}
        <div className="border-b border-studio-border p-5">
          <PromptInput
            prompt={store.prompt}
            negativePrompt={store.negativePrompt}
            showNegative={store.showNegative}
            style={store.style}
            onPromptChange={store.setPrompt}
            onNegativeChange={store.setNegativePrompt}
            onToggleNegative={store.toggleNegative}
            onSurpriseMe={handleSurprise}
          />

          {/* Generate button */}
          <div className="mt-3 flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              loading={store.isGenerating}
              disabled={!store.prompt.trim()}
              variant="glow"
              size="lg"
              className="gap-2.5 font-mono text-sm px-8"
            >
              <Sparkles size={16} />
              {store.isGenerating ? "Generating..." : "Generate"}
            </Button>
            {store.results.length > 0 && (
              <Button variant="ghost" size="sm" onClick={store.clearResults}>
                Clear
              </Button>
            )}
          </div>

          {/* Error */}
          {store.error && (
            <div className="mt-3 px-3 py-2 rounded border border-red-800/50 bg-red-950/30 font-mono text-xs text-red-400">
              {store.error}
            </div>
          )}
        </div>

        {/* Results area */}
        <div className="studio-scrollbar flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <GenerationGrid
            images={store.results}
            isGenerating={store.isGenerating}
            batch={store.batch}
            generationTime={store.generationTime}
            onEdit={handleEdit}
            onVariations={handleVariations}
          />
        </div>

        {/* Prompt history */}
        <div className="border-t border-studio-border px-5 py-3">
          <PromptHistoryStrip
            history={store.promptHistory}
            onSelect={store.setPrompt}
          />
        </div>
      </main>

      {/* ── Right Sidebar: Parameters ────────────────────────────────────── */}
      <aside className="studio-scrollbar w-72 flex-shrink-0 border-l border-studio-border bg-black overflow-y-auto xl:w-80 2xl:w-96">
        <div className="p-4 flex flex-col gap-6 xl:p-5">
          <div className="flex items-center gap-2">
            <Wand2 size={13} className="text-studio-subtle" />
            <span className="font-mono text-xs text-studio-subtle uppercase tracking-wider">Parameters</span>
          </div>
          <ParameterPanel
            aspectRatio={store.aspectRatio}
            quality={store.quality}
            batch={store.batch}
            seed={store.seed}
            onAspectRatio={store.setAspectRatio}
            onQuality={store.setQuality}
            onBatch={store.setBatch}
            onSeed={store.setSeed}
          />
        </div>
      </aside>
    </div>
  );
}
