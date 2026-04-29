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

type MaskMode = "paint" | "erase";

const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(
  ({ imageUrl, onMaskChange }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<any>(null);
    const fabricModuleRef = useRef<any>(null);
    const historyRef = useRef<string[]>([]);
    const redoStackRef = useRef<string[]>([]);
    const brushSize = useEditorStore((state) => state.brushSize);
    const brushTool = useEditorStore((state) => state.brushTool);
    const softEdge = useEditorStore((state) => state.softEdge);
    const setZoom = useEditorStore((state) => state.setZoom);
    const setCanUndo = useEditorStore((state) => state.setCanUndo);
    const setCanRedo = useEditorStore((state) => state.setCanRedo);
    const brushSizeRef = useRef(brushSize);
    const brushToolRef = useRef(brushTool);
    const softEdgeRef = useRef(softEdge);

    useEffect(() => {
      brushSizeRef.current = brushSize;
      brushToolRef.current = brushTool;
      softEdgeRef.current = softEdge;
    }, [brushSize, brushTool, softEdge]);

    const isMaskObject = useCallback((obj: any) => {
      return Boolean(obj?.isMask || obj?.maskMode || obj?.data?.isMask);
    }, []);

    const updateBrush = useCallback((canvas: any, size: number, tool: string, soft: boolean) => {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = size;

      if (tool === "brush") {
        canvas.freeDrawingBrush.color = soft ? "rgba(239,68,68,0.55)" : "rgba(239,68,68,0.85)";
        return;
      }

      // Keep eraser strokes visible in the editor, but encode them as mask subtraction on export.
      canvas.freeDrawingBrush.color = "rgba(96,165,250,0.75)";
    }, []);

    const getMaskObjects = useCallback((canvas: any) => {
      return canvas.getObjects().filter((o: any) => isMaskObject(o));
    }, [isMaskObject]);

    const renderMaskCanvas = useCallback((canvas: any) => {
      const fabric = fabricModuleRef.current;
      if (!canvas || !fabric) return null;

      const maskObjects = getMaskObjects(canvas);
      if (maskObjects.length === 0) return null;

      const tempEl = document.createElement("canvas");
      tempEl.width = canvas.width!;
      tempEl.height = canvas.height!;
      const ctx = tempEl.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, tempEl.width, tempEl.height);

      const tempFabric = new fabric.StaticCanvas(tempEl, {
        width: tempEl.width,
        height: tempEl.height,
      });

      maskObjects.forEach((obj: any) => {
        const clone = fabricClone(obj);
        if (!clone) return;

        // Treat any marked region as a valid mask so users can mark the object they want edited,
        // even if they used the erase tool to refine the selection.
        clone.set({ fill: "#ffffff", stroke: "#ffffff" });
        tempFabric.add(clone);
      });

      tempFabric.renderAll();
      tempFabric.dispose();

      const imageData = ctx.getImageData(0, 0, tempEl.width, tempEl.height).data;
      let hasVisibleMask = false;
      for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] > 0 || imageData[i + 1] > 0 || imageData[i + 2] > 0) {
          hasVisibleMask = true;
          break;
        }
      }

      return hasVisibleMask ? tempEl : null;
    }, [getMaskObjects]);

    const reapplySourceImage = useCallback((canvas: any) => {
      const fabric = fabricModuleRef.current;
      if (!canvas || !fabric || !imageUrl) return;

      fabric.Image.fromURL(imageUrl, (img: any) => {
        if (!img) return;

        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const scale = Math.min(width / img.width, height / img.height);
        img.set({
          left: Math.max((width - img.width * scale) / 2, 0),
          top: Math.max((height - img.height * scale) / 2, 0),
          originX: "left",
          originY: "top",
          selectable: false,
          evented: false,
        });
        img.scale(scale);

        canvas.backgroundColor = "#111111";
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        canvas.requestRenderAll();
      });
    }, [imageUrl]);

    const syncMaskState = useCallback((canvas: any) => {
      onMaskChange?.(getMaskObjects(canvas).length > 0);
    }, [getMaskObjects, onMaskChange]);

    useEffect(() => {
      let cancelled = false;

      historyRef.current = [];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      onMaskChange?.(false);

      if (!imageUrl) {
        setZoom(1);
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
        canvas.calcOffset();

        fabric.Image.fromURL(imageUrl, (img: any) => {
          if (!img || cancelled) return;

          const scale = Math.min(width / img.width, height / img.height);
          img.set({
            left: Math.max((width - img.width * scale) / 2, 0),
            top: Math.max((height - img.height * scale) / 2, 0),
            originX: "left",
            originY: "top",
            selectable: false,
            evented: false,
          });
          img.scale(scale);

          canvas.clear();
          canvas.backgroundColor = "#111111";
          canvas.add(img);
          canvas.sendToBack(img);
          canvas.calcOffset();
          canvas.renderAll();
          canvas.requestRenderAll();
        });

        updateBrush(canvas, brushSizeRef.current, brushToolRef.current, softEdgeRef.current);

        canvas.on("path:created", (opt: any) => {
          const path = opt.path;
          if (!path) return;

          const maskMode: MaskMode = brushToolRef.current === "eraser" ? "erase" : "paint";
          path.set({
            isMask: true,
            maskMode,
            data: { isMask: true, maskMode },
            selectable: false,
            evented: false,
          });

          historyRef.current.push(canvas.toJSON(["data"]) as any);
          redoStackRef.current = [];
          setCanUndo(true);
          setCanRedo(false);
          syncMaskState(canvas);
        });

        setZoom(1);
      })();

      return () => {
        cancelled = true;
        fabricRef.current?.dispose();
        fabricRef.current = null;
      };
    }, [imageUrl, onMaskChange, setCanRedo, setCanUndo, setZoom, syncMaskState, updateBrush]);

    useEffect(() => {
      if (fabricRef.current) {
        updateBrush(fabricRef.current, brushSize, brushTool, softEdge);
      }
    }, [brushSize, brushTool, softEdge, updateBrush]);

    useImperativeHandle(ref, () => ({
      getMaskDataURL: () => {
        const canvas = fabricRef.current;
        if (!canvas) return null;

        if (getMaskObjects(canvas).length === 0) return null;
        const tempEl = renderMaskCanvas(canvas);
        return tempEl ? tempEl.toDataURL("image/png") : null;
      },

      clearMask: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.discardActiveObject();
        canvas.getObjects()
          .filter((o: any) => isMaskObject(o))
          .forEach((o: any) => canvas.remove(o));

        canvas.renderAll();
        canvas.requestRenderAll();
        historyRef.current = [];
        redoStackRef.current = [];
        setCanUndo(false);
        setCanRedo(false);
        onMaskChange?.(false);
      },

      undo: () => {
        const canvas = fabricRef.current;
        if (!canvas || historyRef.current.length === 0) return;

        const state = historyRef.current.pop()!;
        redoStackRef.current.push(state);
        const prev = historyRef.current[historyRef.current.length - 1];

        if (prev) {
          canvas.loadFromJSON(prev, () => {
            reapplySourceImage(canvas);
            canvas.renderAll();
            canvas.requestRenderAll();
            canvas.calcOffset();
            syncMaskState(canvas);
          });
        } else {
          canvas.getObjects()
            .filter((o: any) => isMaskObject(o))
            .forEach((o: any) => canvas.remove(o));
          reapplySourceImage(canvas);
          canvas.renderAll();
          canvas.requestRenderAll();
          canvas.calcOffset();
          syncMaskState(canvas);
        }

        setCanUndo(historyRef.current.length > 0);
        setCanRedo(true);
      },

      redo: () => {
        const canvas = fabricRef.current;
        if (!canvas || redoStackRef.current.length === 0) return;

        const state = redoStackRef.current.pop()!;
        historyRef.current.push(state);
        canvas.loadFromJSON(state, () => {
          reapplySourceImage(canvas);
          canvas.renderAll();
          canvas.requestRenderAll();
          canvas.calcOffset();
          syncMaskState(canvas);
        });
        setCanUndo(true);
        setCanRedo(redoStackRef.current.length > 0);
      },

      zoomIn: () => {
        const canvas = fabricRef.current;
        const fabric = fabricModuleRef.current;
        if (!canvas || !fabric?.Point) return;

        const nextZoom = Math.min(canvas.getZoom() * 1.2, 5);
        canvas.zoomToPoint(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), nextZoom);
        canvas.requestRenderAll();
        setZoom(nextZoom);
      },

      zoomOut: () => {
        const canvas = fabricRef.current;
        const fabric = fabricModuleRef.current;
        if (!canvas || !fabric?.Point) return;

        const nextZoom = Math.max(canvas.getZoom() / 1.2, 0.2);
        canvas.zoomToPoint(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), nextZoom);
        canvas.requestRenderAll();
        setZoom(nextZoom);
      },

      fitToScreen: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.calcOffset();
        canvas.requestRenderAll();
        setZoom(1);
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
