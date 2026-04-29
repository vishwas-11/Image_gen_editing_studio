"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { useEditorStore } from "@/store/galleryStore";

export interface FabricCanvasHandle {
  getMaskDataURL: () => string | null;
  clearMask: () => void;
  undo: () => void;
  redo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
}

interface FabricCanvasProps {
  imageUrl?: string | null;
  onMaskChange?: (hasMask: boolean) => void;
}

const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(
  ({ imageUrl, onMaskChange }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<any>(null);
    const fabricModuleRef = useRef<any>(null);
    const historyRef = useRef<string[]>([]);
    const redoStackRef = useRef<string[]>([]);
    const store = useEditorStore();

    const updateBrush = useCallback((canvas: any, size: number, tool: string, soft: boolean) => {
      if (tool === "brush") {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = size;
        canvas.freeDrawingBrush.color = soft ? "rgba(239,68,68,0.55)" : "rgba(239,68,68,0.85)";
        return;
      }

      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = size;
      canvas.freeDrawingBrush.color = "#111111";
    }, []);

    useEffect(() => {
      let cancelled = false;

      if (!imageUrl) {
        store.setZoom(1);
        return () => {
          cancelled = true;
        };
      }

      (async () => {
        const { fabric } = await import("fabric");
        if (cancelled || !canvasElRef.current) return;
        fabricModuleRef.current = fabric;

        const container = canvasElRef.current.parentElement;
        const width = container?.clientWidth || 800;
        const height = container?.clientHeight || 600;

        const canvas = new fabric.Canvas(canvasElRef.current, {
          width,
          height,
          backgroundColor: "#111111",
          selection: false,
          isDrawingMode: true,
        });
        fabricRef.current = canvas;

        fabric.Image.fromURL(
          imageUrl,
          (img: any) => {
            if (!img || cancelled) return;
            const scale = Math.min(width / img.width, height / img.height);
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
              scaleX: scale,
              scaleY: scale,
              originX: "left",
              originY: "top",
            });
          },
          { crossOrigin: "anonymous" }
        );

        updateBrush(canvas, store.brushSize, store.brushTool, store.softEdge);

        canvas.on("path:created", (opt: any) => {
          const path = opt.path;
          if (!path) return;

          path.set({ data: { isMask: true }, selectable: false, evented: false });
          historyRef.current.push(canvas.toJSON(["data"]) as any);
          redoStackRef.current = [];
          store.setCanUndo(true);
          store.setCanRedo(false);
          onMaskChange?.(canvas.getObjects().filter((o: any) => o.data?.isMask).length > 0);
        });

        store.setZoom(1);
      })();

      return () => {
        cancelled = true;
        fabricRef.current?.dispose();
        fabricRef.current = null;
      };
    }, [imageUrl, onMaskChange, store, updateBrush]);

    useEffect(() => {
      if (fabricRef.current) {
        updateBrush(fabricRef.current, store.brushSize, store.brushTool, store.softEdge);
      }
    }, [store.brushSize, store.brushTool, store.softEdge, updateBrush]);

    useImperativeHandle(ref, () => ({
      getMaskDataURL: () => {
        const canvas = fabricRef.current;
        if (!canvas) return null;

        const maskObjects = canvas.getObjects().filter((o: any) => o.data?.isMask);
        if (maskObjects.length === 0) return null;

        const tempEl = document.createElement("canvas");
        tempEl.width = canvas.width!;
        tempEl.height = canvas.height!;
        const ctx = tempEl.getContext("2d");
        if (!ctx) return null;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, tempEl.width, tempEl.height);

        const tempFabric = new fabricModuleRef.current.StaticCanvas(tempEl, {
          width: tempEl.width,
          height: tempEl.height,
        });

        maskObjects.forEach((obj: any) => {
          const clone = fabricClone(obj);
          if (!clone) return;
          clone.set({ fill: "white", stroke: "white" });
          tempFabric?.add(clone);
        });

        tempFabric?.renderAll();
        return tempEl.toDataURL("image/png");
      },

      clearMask: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.getObjects()
          .filter((o: any) => o.data?.isMask)
          .forEach((o: any) => canvas.remove(o));

        canvas.renderAll();
        historyRef.current = [];
        redoStackRef.current = [];
        store.setCanUndo(false);
        store.setCanRedo(false);
        onMaskChange?.(false);
      },

      undo: () => {
        const canvas = fabricRef.current;
        if (!canvas || historyRef.current.length === 0) return;

        const state = historyRef.current.pop()!;
        redoStackRef.current.push(state);
        const prev = historyRef.current[historyRef.current.length - 1];

        if (prev) {
          canvas.loadFromJSON(prev, () => canvas.renderAll());
        } else {
          canvas.getObjects()
            .filter((o: any) => o.data?.isMask)
            .forEach((o: any) => canvas.remove(o));
          canvas.renderAll();
        }

        store.setCanUndo(historyRef.current.length > 0);
        store.setCanRedo(true);
      },

      redo: () => {
        const canvas = fabricRef.current;
        if (!canvas || redoStackRef.current.length === 0) return;

        const state = redoStackRef.current.pop()!;
        historyRef.current.push(state);
        canvas.loadFromJSON(state, () => canvas.renderAll());
        store.setCanUndo(true);
        store.setCanRedo(redoStackRef.current.length > 0);
      },

      zoomIn: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const nextZoom = Math.min(canvas.getZoom() * 1.2, 5);
        canvas.setZoom(nextZoom);
        store.setZoom(nextZoom);
      },

      zoomOut: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const nextZoom = Math.max(canvas.getZoom() / 1.2, 0.2);
        canvas.setZoom(nextZoom);
        store.setZoom(nextZoom);
      },

      fitToScreen: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        store.setZoom(1);
      },
    }));

    if (!imageUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-studio-border bg-studio-surface/30 p-6 text-center">
          <div className="max-w-sm">
            <p className="font-display text-base text-white">Pick a source image to start editing</p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-studio-subtle">
              Open an image from the gallery and send it here to paint a mask, inpaint, or outpaint.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fabric-container h-full w-full">
        <canvas ref={canvasElRef} />
      </div>
    );
  }
);

FabricCanvas.displayName = "FabricCanvas";

function fabricClone(obj: any): any {
  if (!obj) return null;
  try {
    return obj.clone?.() ?? null;
  } catch {
    return null;
  }
}

export default FabricCanvas;
