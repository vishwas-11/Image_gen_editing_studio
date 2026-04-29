"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageOff, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/lib/constants";
import type { StylePreset } from "@/types";
import { useEditorStore } from "@/store/galleryStore";

import FabricCanvas, { FabricCanvasHandle } from "./FabricCanvas";
import { EditorToolbar } from "./EditorToolbar";
import { BrushSettings } from "./BrushSettings";
import { InpaintPanel } from "./InpaintPanel";
import { OutpaintControls } from "./OutpaintControls";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

export function EditorWorkspace() {
  const router = useRouter();
  const canvasRef = useRef<FabricCanvasHandle>(null);
  const { sourceImageUrl, sourceImageId, canUndo, canRedo, zoom, clearSourceImage } = useEditorStore();
  const [hasMask, setHasMask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replaceImageOpen, setReplaceImageOpen] = useState(false);

  useEffect(() => {
    setHasMask(false);
  }, [sourceImageUrl]);

  const handleClearSourceImage = useCallback(() => {
    canvasRef.current?.clearMask();
    clearSourceImage();
    setHasMask(false);
    setIsLoading(false);
    setReplaceImageOpen(false);
    toast.success("Current image removed");
  }, [clearSourceImage]);

  const handleInpaint = (prompt: string, style: StylePreset) => {
    if (!sourceImageUrl || !hasMask || !prompt.trim()) {
      toast.error("Paint a mask and add a prompt first");
      return;
    }

    setIsLoading(true);
    toast.info(`Inpaint queued with ${style} style`);
    setIsLoading(false);
  };

  const handleRemoveBg = () => {
    if (!sourceImageUrl) {
      toast.error("Select a source image first");
      return;
    }

    setIsLoading(true);
    toast.info("Remove background is not connected yet");
    setIsLoading(false);
  };

  const handleStyleTransfer = (style: StylePreset) => {
    if (!sourceImageUrl) {
      toast.error("Select a source image first");
      return;
    }

    setIsLoading(true);
    toast.info(`Style transfer queued: ${style}`);
    setIsLoading(false);
  };

  const handleOutpaint = (directions: string[], pixels: number, prompt?: string) => {
    if (!sourceImageUrl || directions.length === 0) {
      toast.error("Select at least one direction");
      return;
    }

    setIsLoading(true);
    toast.info(`Outpaint queued for ${directions.join(", ")} by ${pixels}px`);
    if (prompt) {
      toast.info(prompt);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-black">
      <aside className="w-72 flex-shrink-0 overflow-y-auto border-r border-studio-border bg-black">
        <BrushSettings />
        <InpaintPanel
          hasMask={hasMask}
          isLoading={isLoading}
          onInpaint={handleInpaint}
          onRemoveBg={handleRemoveBg}
          onStyleTransfer={handleStyleTransfer}
        />
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden bg-black">
        <EditorToolbar
          canUndo={canUndo}
          canRedo={canRedo}
          zoom={zoom}
          onUndo={() => canvasRef.current?.undo()}
          onRedo={() => canvasRef.current?.redo()}
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onFitScreen={() => canvasRef.current?.fitToScreen()}
          onClearMask={() => canvasRef.current?.clearMask()}
          onReplaceImage={() => setReplaceImageOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden p-4">
          <div className="flex-1 overflow-hidden rounded-2xl border border-studio-border bg-studio-surface/20">
            <FabricCanvas ref={canvasRef} imageUrl={sourceImageUrl} onMaskChange={setHasMask} />
          </div>
        </div>
      </main>

      <aside className="w-72 flex-shrink-0 overflow-y-auto border-l border-studio-border bg-black">
        <div className="flex flex-col gap-4 p-4">
          <div className="rounded-xl border border-studio-border bg-studio-surface/40 p-4">
            <div className="flex items-center gap-2">
              <Wand2 size={14} className="text-studio-subtle" />
              <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">
                Source
              </span>
            </div>
            {sourceImageUrl ? (
              <>
                <p className="mt-3 text-sm text-white">Ready for editing</p>
                {sourceImageId && (
                  <p className="mt-1 font-mono text-[10px] text-studio-subtle">
                    Image ID: {sourceImageId}
                  </p>
                )}
              </>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-3 text-center">
                <ImageOff size={20} className="text-studio-subtle" />
                <p className="font-mono text-xs leading-relaxed text-studio-subtle">
                  Select a gallery image to begin editing.
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.GALLERY)}>
                  Open gallery
                </Button>
              </div>
            )}
          </div>

          <BeforeAfterSlider beforeUrl={sourceImageUrl ?? ""} afterUrl="" />
          <OutpaintControls isLoading={isLoading} onOutpaint={handleOutpaint} />
        </div>
      </aside>

      <Dialog open={replaceImageOpen} onOpenChange={setReplaceImageOpen}>
        <DialogContent className="border-studio-border bg-black text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Replace current image?</DialogTitle>
            <DialogDescription className="text-studio-subtle">
              This will remove the image from the editor and clear any active mask or preview.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-studio-border bg-studio-surface/30">
            <Button variant="outline" onClick={() => setReplaceImageOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearSourceImage}>
              Replace image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EditorWorkspace;
