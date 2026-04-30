"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Images } from "lucide-react";

import { AuthGuard, LoadingOverlay, ImageDropzone } from "@/components/shared/index";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { BrushSettings } from "@/components/editor/BrushSettings";
import { InpaintPanel } from "@/components/editor/InpaintPanel";
import { OutpaintControls } from "@/components/editor/OutpaintControls";
import { ImageToImagePanel } from "@/components/editor/ImageToImagePanel";
import { BeforeAfterSlider } from "@/components/editor/BeforeAfterSlider";
import { useEditorStore } from "@/store/galleryStore";
import { editApi } from "@/lib/api/edit";
import { galleryApi, uploadApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants";
import FabricCanvas, { FabricCanvasHandle } from "@/components/editor/FabricCanvas";
import type { StylePreset } from "@/types";

export default function EditorPage() {
  return (
    <AuthGuard>
      <EditorContent />
    </AuthGuard>
  );
}

function EditorContent() {
  const router = useRouter();
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const store = useEditorStore();
  const [recentImages, setRecentImages] = useState<Awaited<ReturnType<typeof galleryApi.list>>["items"]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Processing...");
  const [hasMask, setHasMask] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewBeforeUrl, setPreviewBeforeUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"inpaint" | "outpaint" | "img2img">("inpaint");
  const [replaceImageOpen, setReplaceImageOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGalleryLoading(true);

    galleryApi
      .list({ page: 1, page_size: 12 })
      .then((res) => {
        if (!cancelled) setRecentImages(res.items);
      })
      .catch(() => {
        if (!cancelled) setRecentImages([]);
      })
      .finally(() => {
        if (!cancelled) setGalleryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setLoading(true);
      setLoadingMsg("Uploading image...");
      try {
        const res = await uploadApi.uploadFile(file);
        store.setSourceImage(res.image_url, res.cloudinary_public_id);
        setResultUrl(null);
        setPreviewBeforeUrl(null);
        setHasMask(false);
        toast.success("Image loaded into canvas");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [store],
  );

  const handleSelectGalleryImage = useCallback(
    (imageUrl: string, imageId: string) => {
      store.setSourceImage(imageUrl, imageId);
      setResultUrl(null);
      setPreviewBeforeUrl(null);
      setHasMask(false);
      toast.success("Image loaded from gallery");
    },
    [store],
  );

  const handleImg2ImgUpload = useCallback(
    async (file: File) => {
      setLoading(true);
      setLoadingMsg("Uploading reference image...");
      try {
        const res = await uploadApi.uploadFile(file);
        store.setSourceImage(res.image_url, res.cloudinary_public_id);
        setResultUrl(null);
        setPreviewBeforeUrl(null);
        setHasMask(false);
        toast.success("Reference image loaded");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [store],
  );

  const handleReplaceImage = useCallback(() => {
    canvasRef.current?.clearMask();
    store.clearSourceImage();
    setResultUrl(null);
    setPreviewBeforeUrl(null);
    setHasMask(false);
    setReplaceImageOpen(false);
    toast.success("Current image removed");
  }, [store]);

  const handleInpaint = useCallback(
    async (prompt: string, style: StylePreset) => {
      const sourceImageUrl = store.sourceImageUrl;
      const maskDataURL = canvasRef.current?.getMaskDataURL();
      if (!maskDataURL || !sourceImageUrl) {
        toast.error("Paint a mask on the image first");
        return;
      }

      setLoading(true);
      setLoadingMsg("Uploading mask...");
      try {
        const maskUpload = await uploadApi.uploadMaskBase64(maskDataURL);
        setLoadingMsg("Inpainting with AI...");
        setPreviewBeforeUrl(sourceImageUrl);
        const res = await editApi.inpaint({
          original_image_url: sourceImageUrl,
          mask_image_url: maskUpload.image_url,
          prompt,
          style,
        });
        setResultUrl(res.images[0]?.image_url ?? null);
        store.setSourceImage(res.images[0]?.image_url ?? store.sourceImageUrl);
        canvasRef.current?.clearMask();
        setHasMask(false);
        toast.success("Inpainting complete!");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [store],
  );

  const handleRemoveBg = useCallback(async () => {
    const sourceImageUrl = store.sourceImageUrl;
    if (!sourceImageUrl) return;

    setLoading(true);
    setLoadingMsg("Removing background...");
    try {
      setPreviewBeforeUrl(sourceImageUrl);
      const res = await editApi.removeBg({
        image_url: sourceImageUrl,
        replacement_type: "transparent",
      });
      setResultUrl(res.images[0]?.image_url ?? null);
      store.setSourceImage(res.images[0]?.image_url ?? store.sourceImageUrl);
      toast.success("Background removed!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [store]);

  const handleStyleTransfer = useCallback(
    async (style: StylePreset) => {
      const sourceImageUrl = store.sourceImageUrl;
      if (!sourceImageUrl) return;

      setLoading(true);
      setLoadingMsg("Applying style transfer...");
      try {
        setPreviewBeforeUrl(sourceImageUrl);
        const res = await editApi.styleTransfer({
          source_image_url: sourceImageUrl,
          style,
        });
        setResultUrl(res.images[0]?.image_url ?? null);
        store.setSourceImage(res.images[0]?.image_url ?? store.sourceImageUrl);
        toast.success("Style transfer applied!");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [store],
  );

  const handleImg2Img = useCallback(
    async ({
      prompt,
      negativePrompt,
      style,
      strength,
    }: {
      prompt: string;
      negativePrompt?: string;
      style: StylePreset;
      strength: number;
    }) => {
      const sourceImageUrl = store.sourceImageUrl;
      if (!sourceImageUrl || !prompt.trim()) {
        toast.error("Load a reference image and add a prompt first");
        return;
      }

      setLoading(true);
      setLoadingMsg("Running image-to-image...");
      try {
        setPreviewBeforeUrl(sourceImageUrl);
        const res = await editApi.img2img({
          source_image_url: sourceImageUrl,
          prompt,
          negative_prompt: negativePrompt,
          style,
          strength,
        });
        setResultUrl(res.images[0]?.image_url ?? null);
        if (res.images[0]?.image_url) {
          store.setSourceImage(res.images[0].image_url);
        }
        setHasMask(false);
        toast.success("Image-to-image complete!");
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [store],
  );

  const handleOutpaint = useCallback(
    async (directions: string[], pixels: number, prompt?: string) => {
      const sourceImageUrl = store.sourceImageUrl;
      if (!sourceImageUrl) return;

      setLoading(true);
      setLoadingMsg("Generating outpaint...");
      try {
        setPreviewBeforeUrl(sourceImageUrl);
        const res = await editApi.outpaint({
          original_image_url: sourceImageUrl,
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
    },
    [store],
  );

  if (!store.sourceImageUrl) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl text-white">Image Editor</h1>
          <p className="mt-2 font-mono text-xs leading-relaxed text-studio-subtle">
            Start with a gallery image or upload a new one. Once selected, the editor tools become available immediately.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl border border-studio-border bg-black p-5">
            <div className="mb-4">
              <h2 className="font-display text-lg text-white">Upload new image</h2>
              <p className="mt-1 font-mono text-[11px] text-studio-subtle">
                Use a file from your device when it is not already in the gallery.
                It will also become the reference image for image-to-image.
              </p>
            </div>
            <ImageDropzone
              onFile={handleFileUpload}
              label="Drop an image or click to upload"
              className="py-16"
            />
          </section>

          <section className="rounded-2xl border border-studio-border bg-black p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-white">Select from gallery</h2>
                <p className="mt-1 font-mono text-[11px] text-studio-subtle">
                  Pick a recent image to open it directly in the editor and use it as an img2img reference.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push(ROUTES.GALLERY)}
                className="gap-2"
              >
                Browse gallery
                <ArrowRight size={13} />
              </Button>
            </div>

            <ScrollArea className="h-[28rem] pr-3">
              {galleryLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-xl skeleton" />
                  ))}
                </div>
              ) : recentImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {recentImages.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => handleSelectGalleryImage(image.image_url, image.id)}
                      className="group overflow-hidden rounded-xl border border-studio-border bg-studio-surface text-left transition-all hover:border-studio-blue/60 hover:shadow-[0_0_0_1px_rgba(14,165,233,0.15)]"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={image.thumbnail_url ?? image.image_url}
                          alt={image.prompt ?? "Gallery image"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 50vw, 25vw"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 font-mono text-[10px] leading-relaxed text-white/80">
                          {image.prompt ?? "Untitled image"}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-studio-subtle">
                          Click to edit
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[18rem] items-center justify-center rounded-xl border border-dashed border-studio-border bg-studio-surface/20 px-6 text-center">
                  <div>
                    <Images size={20} className="mx-auto text-studio-subtle" />
                    <p className="mt-3 font-display text-sm text-white">No gallery images yet</p>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-studio-subtle">
                      Generate or upload an image first, then come back here to edit it.
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </section>
        </div>

        {loading && <LoadingOverlay isLoading message="Uploading..." />}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden bg-black">
      <EditorToolbar
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        zoom={store.zoom}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onFitScreen={() => canvasRef.current?.fitToScreen()}
        onClearMask={() => {
          canvasRef.current?.clearMask();
          setHasMask(false);
        }}
        onReplaceImage={() => setReplaceImageOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-48 flex-shrink-0 overflow-y-auto border-r border-studio-border">
          <BrushSettings />
        </aside>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 bg-[#0a0a0a]">
            <FabricCanvas
              ref={canvasRef}
              imageUrl={store.sourceImageUrl}
              onMaskChange={setHasMask}
            />
            {loading && <LoadingOverlay isLoading message={loadingMsg} />}
          </div>

          {resultUrl && store.sourceImageUrl && (
            <div className="border-t border-studio-border bg-black p-4">
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-studio-subtle">
                Result Preview
              </p>
              <div className="mx-auto max-w-lg">
                <BeforeAfterSlider
                  beforeUrl={previewBeforeUrl ?? store.sourceImageUrl}
                  afterUrl={resultUrl}
                />
              </div>
            </div>
          )}
        </main>

        <aside className="flex w-64 flex-shrink-0 min-h-0 flex-col border-l border-studio-border">
          <div className="sticky top-0 z-20 border-b border-studio-border bg-black/95 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-1 p-2">
              {(["inpaint", "outpaint", "img2img"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? "bg-studio-blue text-white"
                      : "bg-studio-surface text-studio-subtle hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === "inpaint" ? (
              <InpaintPanel
                hasMask={hasMask}
                isLoading={loading}
                onInpaint={handleInpaint}
                onRemoveBg={handleRemoveBg}
                onStyleTransfer={handleStyleTransfer}
              />
            ) : activeTab === "outpaint" ? (
              <OutpaintControls
                isLoading={loading}
                onOutpaint={handleOutpaint}
              />
            ) : (
              <ImageToImagePanel
                isLoading={loading}
                onUploadReference={handleImg2ImgUpload}
                onRun={handleImg2Img}
              />
            )}
          </div>
        </aside>
      </div>

      <Dialog open={replaceImageOpen} onOpenChange={setReplaceImageOpen}>
        <DialogContent className="border-studio-border bg-black text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Replace current image?</DialogTitle>
            <DialogDescription className="text-studio-subtle">
              This will remove the image from the editor and clear the current mask and edit preview.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-studio-border bg-studio-surface/30">
            <Button variant="outline" onClick={() => setReplaceImageOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReplaceImage}>
              Replace image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
