"use client";
import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageDropzone, AuthGuard, LoadingOverlay } from "@/components/shared/index";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { BrushSettings } from "@/components/editor/BrushSettings";
import { InpaintPanel } from "@/components/editor/InpaintPanel";
import { OutpaintControls } from "@/components/editor/OutpaintControls";
import { BeforeAfterSlider } from "@/components/editor/BeforeAfterSlider";
import { useEditorStore } from "@/store/galleryStore";
import { editApi } from "@/lib/api/edit";
import { uploadApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants";
import type { FabricCanvasHandle } from "@/components/editor/FabricCanvas";
import type { StylePreset } from "@/types";

// SSR-safe Fabric import
const FabricCanvas = dynamic(() => import("@/components/editor/FabricCanvas"), { ssr: false });

export default function EditorPage() {
  return <AuthGuard><EditorContent /></AuthGuard>;
}

function EditorContent() {
  const router        = useRouter();
  const canvasRef     = useRef<FabricCanvasHandle>(null);
  const store         = useEditorStore();
  const [loading, setLoading]      = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Processing...");
  const [hasMask, setHasMask]      = useState(false);
  const [resultUrl, setResultUrl]  = useState<string | null>(null);
  const [activeTab, setActiveTab]  = useState<"inpaint" | "outpaint">("inpaint");

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setLoadingMsg("Uploading image...");
    try {
      const res = await uploadApi.uploadFile(file);
      store.setSourceImage(res.image_url);
      setResultUrl(null);
      setHasMask(false);
      toast.success("Image loaded into canvas");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [store]);

  const handleInpaint = useCallback(async (prompt: string, style: StylePreset) => {
    const maskDataURL = canvasRef.current?.getMaskDataURL();
    if (!maskDataURL || !store.sourceImageUrl) {
      toast.error("Paint a mask on the image first");
      return;
    }
    setLoading(true);
    setLoadingMsg("Uploading mask...");
    try {
      const maskUpload = await uploadApi.uploadMaskBase64(maskDataURL);
      setLoadingMsg("Inpainting with AI...");
      const res = await editApi.inpaint({
        original_image_url: store.sourceImageUrl,
        mask_image_url:     maskUpload.image_url,
        prompt,
        style,
      });
      setResultUrl(res.images[0]?.image_url ?? null);
      store.setSourceImage(res.images[0]?.image_url ?? store.sourceImageUrl);
      toast.success("Inpainting complete!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [store]);

  const handleRemoveBg = useCallback(async () => {
    if (!store.sourceImageUrl) return;
    setLoading(true);
    setLoadingMsg("Removing background...");
    try {
      const res = await editApi.removeBg({ image_url: store.sourceImageUrl, replacement_type: "transparent" });
      setResultUrl(res.images[0]?.image_url ?? null);
      store.setSourceImage(res.images[0]?.image_url ?? store.sourceImageUrl);
      toast.success("Background removed!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [store]);

  const handleStyleTransfer = useCallback(async (style: StylePreset) => {
    if (!store.sourceImageUrl) return;
    setLoading(true);
    setLoadingMsg("Applying style transfer...");
    try {
      const res = await editApi.styleTransfer({ source_image_url: store.sourceImageUrl, style });
      setResultUrl(res.images[0]?.image_url ?? null);
      store.setSourceImage(res.images[0]?.image_url ?? store.sourceImageUrl);
      toast.success("Style transfer applied!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [store]);

  const handleOutpaint = useCallback(async (directions: string[], pixels: number, prompt?: string) => {
    if (!store.sourceImageUrl) return;
    setLoading(true);
    setLoadingMsg("Generating outpaint...");
    try {
      const res = await editApi.outpaint({
        original_image_url: store.sourceImageUrl,
        directions: directions as any,
        pixels,
        prompt,
      });
      setResultUrl(res.images[0]?.image_url ?? null);
      store.setSourceImage(res.images[0]?.image_url ?? store.sourceImageUrl);
      toast.success("Outpainting complete!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [store]);

  // If no source image — show upload screen
  if (!store.sourceImageUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-lg">
          <h1 className="font-display text-3xl text-white mb-2 text-center">Image Editor</h1>
          <p className="font-mono text-xs text-studio-subtle text-center mb-8">
            Upload an image to start editing
          </p>
          <ImageDropzone
            onFile={handleFileUpload}
            label="Drop an image or click to upload"
            className="py-16"
          />
          {loading && <LoadingOverlay isLoading message="Uploading..." />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-black">

      {/* ── Top toolbar ─────────────────────────────────────── */}
      <div className="absolute top-14 inset-x-0 z-10">
        <EditorToolbar
          canUndo={store.canUndo}
          canRedo={store.canRedo}
          zoom={store.zoom}
          onUndo={() => canvasRef.current?.undo()}
          onRedo={() => canvasRef.current?.redo()}
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onFitScreen={() => canvasRef.current?.fitToScreen()}
          onClearMask={() => { canvasRef.current?.clearMask(); setHasMask(false); }}
        />
      </div>

      {/* ── Left: Brush settings ─────────────────────────────── */}
      <aside className="w-48 flex-shrink-0 border-r border-studio-border overflow-y-auto mt-12">
        <BrushSettings />
      </aside>

      {/* ── Center: Canvas ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden mt-12 relative">
        <div className="flex-1 relative bg-[#0a0a0a]">
          <FabricCanvas
            ref={canvasRef}
            imageUrl={store.sourceImageUrl}
            onMaskChange={setHasMask}
          />
          {loading && (
            <LoadingOverlay isLoading message={loadingMsg} />
          )}
        </div>

        {/* Before/After when result is ready */}
        {resultUrl && store.sourceImageUrl && (
          <div className="border-t border-studio-border p-4 bg-black">
            <p className="font-mono text-xs text-studio-subtle mb-3 uppercase tracking-wider">Result Preview</p>
            <div className="max-w-lg mx-auto">
              <BeforeAfterSlider
                beforeUrl={store.sourceImageUrl}
                afterUrl={resultUrl}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── Right: Edit controls ─────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 border-l border-studio-border overflow-y-auto mt-12">
        {/* Tab switcher */}
        <div className="flex border-b border-studio-border">
          {(["inpaint", "outpaint"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-studio-blue"
                  : "text-studio-subtle hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "inpaint" ? (
          <InpaintPanel
            hasMask={hasMask}
            isLoading={loading}
            onInpaint={handleInpaint}
            onRemoveBg={handleRemoveBg}
            onStyleTransfer={handleStyleTransfer}
          />
        ) : (
          <OutpaintControls
            isLoading={loading}
            onOutpaint={handleOutpaint}
          />
        )}
      </aside>
    </div>
  );
}
