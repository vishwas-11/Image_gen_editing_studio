"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { useEditorStore } from "@/store/galleryStore";
import type { EditorTool } from "@/types";

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
type Point = { x: number; y: number };

const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(({ imageUrl, onMaskChange }, ref) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const fabricModuleRef = useRef<any>(null);
  const historyRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const rectPreviewRef = useRef<any>(null);
  const rectStartRef = useRef<Point | null>(null);
  const lassoPreviewRef = useRef<any>(null);
  const lassoPointsRef = useRef<Point[]>([]);
  const panStartRef = useRef<{ x: number; y: number; viewport: number[] } | null>(null);
  const draggingRef = useRef(false);
  const spacePressedRef = useRef(false);
  const lastAppliedToolRef = useRef<EditorTool>("brush");

  const brushSize = useEditorStore((state) => state.brushSize);
  const brushTool = useEditorStore((state) => state.brushTool);
  const editorTool = useEditorStore((state) => state.editorTool);
  const brushOpacity = useEditorStore((state) => state.brushOpacity);
  const softEdge = useEditorStore((state) => state.softEdge);
  const setZoom = useEditorStore((state) => state.setZoom);
  const setCanUndo = useEditorStore((state) => state.setCanUndo);
  const setCanRedo = useEditorStore((state) => state.setCanRedo);

  const brushSizeRef = useRef(brushSize);
  const brushToolRef = useRef(brushTool);
  const editorToolRef = useRef(editorTool);
  const brushOpacityRef = useRef(brushOpacity);
  const softEdgeRef = useRef(softEdge);

  useEffect(() => {
    brushSizeRef.current = brushSize;
    brushToolRef.current = brushTool;
    editorToolRef.current = editorTool;
    brushOpacityRef.current = brushOpacity;
    softEdgeRef.current = softEdge;
  }, [brushSize, brushTool, editorTool, brushOpacity, softEdge]);

  const isMaskObject = useCallback((obj: any) => {
    return Boolean(obj?.isMask || obj?.maskMode || obj?.data?.isMask);
  }, []);

  const getMaskObjects = useCallback(
    (canvas: any) => canvas.getObjects().filter((o: any) => isMaskObject(o)),
    [isMaskObject]
  );

  const clearTransientDrawing = useCallback((canvas?: any) => {
    const activeCanvas = canvas ?? fabricRef.current;
    if (!activeCanvas) return;

    if (rectPreviewRef.current) {
      activeCanvas.remove(rectPreviewRef.current);
      rectPreviewRef.current = null;
    }
    if (lassoPreviewRef.current) {
      activeCanvas.remove(lassoPreviewRef.current);
      lassoPreviewRef.current = null;
    }

    rectStartRef.current = null;
    lassoPointsRef.current = [];
    panStartRef.current = null;
    draggingRef.current = false;
  }, []);

  const syncMaskState = useCallback(
    (canvas: any) => {
      onMaskChange?.(getMaskObjects(canvas).length > 0);
    },
    [getMaskObjects, onMaskChange]
  );

  const recordHistory = useCallback(
    (canvas: any) => {
      historyRef.current.push(canvas.toJSON(["data"]) as any);
      redoStackRef.current = [];
      setCanUndo(historyRef.current.length > 0);
      setCanRedo(false);
      syncMaskState(canvas);
    },
    [setCanRedo, setCanUndo, syncMaskState]
  );

  const applyBrushSettings = useCallback(
    (canvas: any, size: number, tool: string, opacity: number, soft: boolean) => {
      canvas.freeDrawingBrush.width = size;
      const alpha = Math.max(0.05, Math.min(1, opacity * (soft ? 0.72 : 1)));
      if (tool === "brush") {
        canvas.freeDrawingBrush.color = `rgba(239,68,68,${alpha})`;
        return;
      }
      canvas.freeDrawingBrush.color = `rgba(96,165,250,${alpha})`;
    },
    []
  );

  const applyInteractionMode = useCallback(
    (canvas: any) => {
      const effectiveTool: EditorTool = spacePressedRef.current ? "pan" : editorToolRef.current;

      if (lastAppliedToolRef.current !== effectiveTool) {
        clearTransientDrawing(canvas);
        lastAppliedToolRef.current = effectiveTool;
      }

      if (effectiveTool === "brush" || effectiveTool === "eraser") {
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.skipTargetFind = true;
        canvas.defaultCursor = "crosshair";
        applyBrushSettings(canvas, brushSizeRef.current, brushToolRef.current, brushOpacityRef.current, softEdgeRef.current);
        return;
      }

      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.skipTargetFind = true;
      canvas.defaultCursor = effectiveTool === "pan" ? "grab" : "crosshair";
    },
    [applyBrushSettings, clearTransientDrawing]
  );

  const reapplySourceImage = useCallback(
    (canvas: any) => {
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
    },
    [imageUrl]
  );

  const finalizeMaskShape = useCallback(
    (canvas: any, shape: any, maskMode: MaskMode) => {
      if (!shape) return;
      shape.set({
        isMask: true,
        maskMode,
        data: { isMask: true, maskMode },
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        opacity: brushOpacityRef.current,
      });
      canvas.requestRenderAll();
      recordHistory(canvas);
    },
    [recordHistory]
  );

  const finalizeRectangle = useCallback(
    (canvas: any) => {
      const rect = rectPreviewRef.current;
      const start = rectStartRef.current;
      if (!rect || !start) return;

      const width = Number(rect.width || 0);
      const height = Number(rect.height || 0);
      if (width < 4 || height < 4) {
        canvas.remove(rect);
        rectPreviewRef.current = null;
        rectStartRef.current = null;
        canvas.requestRenderAll();
        return;
      }

      const maskMode: MaskMode = brushToolRef.current === "eraser" ? "erase" : "paint";
      finalizeMaskShape(canvas, rect, maskMode);
      rectPreviewRef.current = null;
      rectStartRef.current = null;
    },
    [finalizeMaskShape]
  );

  const finalizeLasso = useCallback(
    (canvas: any) => {
      const fabric = fabricModuleRef.current;
      const preview = lassoPreviewRef.current;
      const points = lassoPointsRef.current;
      if (!canvas || !fabric || !preview) return;

      if (points.length < 3) {
        canvas.remove(preview);
        lassoPreviewRef.current = null;
        lassoPointsRef.current = [];
        canvas.requestRenderAll();
        return;
      }

      const minX = Math.min(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const polygonPoints = points.map((p) => ({ x: p.x - minX, y: p.y - minY }));
      const maskMode: MaskMode = brushToolRef.current === "eraser" ? "erase" : "paint";

      canvas.remove(preview);
      const polygon = new fabric.Polygon(polygonPoints, {
        left: minX,
        top: minY,
        fill: maskMode === "erase" ? "rgba(96,165,250,0.22)" : "rgba(239,68,68,0.22)",
        stroke: maskMode === "erase" ? "rgba(96,165,250,0.9)" : "rgba(239,68,68,0.9)",
        strokeWidth: 1.5,
        objectCaching: false,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });
      canvas.add(polygon);

      lassoPreviewRef.current = null;
      lassoPointsRef.current = [];
      finalizeMaskShape(canvas, polygon, maskMode);
    },
    [finalizeMaskShape]
  );

  const updateRectanglePreview = useCallback((canvas: any, pointer: Point) => {
    const start = rectStartRef.current;
    const rect = rectPreviewRef.current;
    if (!start || !rect) return;

    const left = Math.min(start.x, pointer.x);
    const top = Math.min(start.y, pointer.y);
    const width = Math.abs(pointer.x - start.x);
    const height = Math.abs(pointer.y - start.y);

    rect.set({
      left,
      top,
      width,
      height,
      opacity: brushOpacityRef.current,
    });
    rect.setCoords();
    canvas.requestRenderAll();
  }, []);

  const updateLassoPreview = useCallback((canvas: any, pointer: Point) => {
    const points = lassoPointsRef.current;
    const preview = lassoPreviewRef.current;
    if (!preview || points.length === 0) return;

    const last = points[points.length - 1];
    const dx = pointer.x - last.x;
    const dy = pointer.y - last.y;
    if (Math.sqrt(dx * dx + dy * dy) < 4) return;

    points.push({ x: pointer.x, y: pointer.y });
    preview.set({ points: points.map((p) => ({ x: p.x, y: p.y })) });
    preview.setCoords();
    canvas.requestRenderAll();
  }, []);

  const startPan = useCallback((canvas: any, pointer: Point) => {
    panStartRef.current = {
      x: pointer.x,
      y: pointer.y,
      viewport: canvas.viewportTransform ? [...canvas.viewportTransform] : [1, 0, 0, 1, 0, 0],
    };
    draggingRef.current = true;
    canvas.setCursor("grabbing");
  }, []);

  const updatePan = useCallback((canvas: any, pointer: Point) => {
    const panStart = panStartRef.current;
    if (!panStart) return;

    const vpt = [...panStart.viewport];
    vpt[4] = panStart.viewport[4] + (pointer.x - panStart.x);
    vpt[5] = panStart.viewport[5] + (pointer.y - panStart.y);
    canvas.setViewportTransform(vpt);
    canvas.requestRenderAll();
  }, []);

  const startRectangle = useCallback((canvas: any, pointer: Point) => {
    const fabric = fabricModuleRef.current;
    if (!fabric) return;

    rectStartRef.current = pointer;
    const maskMode: MaskMode = brushToolRef.current === "eraser" ? "erase" : "paint";
    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 1,
      height: 1,
      fill: maskMode === "erase" ? "rgba(96,165,250,0.22)" : "rgba(239,68,68,0.22)",
      stroke: maskMode === "erase" ? "rgba(96,165,250,0.9)" : "rgba(239,68,68,0.9)",
      strokeWidth: 1.5,
      objectCaching: false,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      opacity: brushOpacityRef.current,
    });
    rectPreviewRef.current = rect;
    canvas.add(rect);
  }, []);

  const startLasso = useCallback((canvas: any, pointer: Point) => {
    const fabric = fabricModuleRef.current;
    if (!fabric) return;

    lassoPointsRef.current = [pointer];
    const preview = new fabric.Polyline([{ x: pointer.x, y: pointer.y }], {
      left: 0,
      top: 0,
      fill: "rgba(255,255,255,0.04)",
      stroke: "rgba(255,255,255,0.8)",
      strokeWidth: 1.5,
      strokeDashArray: [5, 4],
      objectCaching: false,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
    });
    lassoPreviewRef.current = preview;
    canvas.add(preview);
  }, []);

  const setCanvasCursorForMode = useCallback((canvas: any) => {
    const effectiveTool: EditorTool = spacePressedRef.current ? "pan" : editorToolRef.current;
    canvas.setCursor(effectiveTool === "pan" ? "grab" : "crosshair");
  }, []);

  const isTypingTarget = useCallback((target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      target.isContentEditable ||
      target.getAttribute("role") === "textbox"
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.code !== "Space" || event.repeat) return;
      spacePressedRef.current = true;
      const canvas = fabricRef.current;
      if (canvas) {
        applyInteractionMode(canvas);
      }
      event.preventDefault();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.code !== "Space") return;
      spacePressedRef.current = false;
      const canvas = fabricRef.current;
      if (canvas) {
        applyInteractionMode(canvas);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [applyInteractionMode, isTypingTarget]);

  useEffect(() => {
    let cancelled = false;

    historyRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    onMaskChange?.(false);
    clearTransientDrawing();

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
        skipTargetFind: true,
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
        applyInteractionMode(canvas);
        setCanvasCursorForMode(canvas);
      });

      canvas.on("mouse:down", (opt: any) => {
        const activeTool: EditorTool = spacePressedRef.current ? "pan" : editorToolRef.current;
        const pointer = canvas.getPointer(opt.e);

        if (activeTool === "pan") {
          startPan(canvas, pointer);
          return;
        }
        if (activeTool === "rectangle") {
          startRectangle(canvas, pointer);
          return;
        }
        if (activeTool === "lasso") {
          startLasso(canvas, pointer);
        }
      });

      canvas.on("mouse:move", (opt: any) => {
        const pointer = canvas.getPointer(opt.e);
        const activeTool: EditorTool = spacePressedRef.current ? "pan" : editorToolRef.current;

        if (activeTool === "pan" && draggingRef.current) {
          updatePan(canvas, pointer);
          return;
        }
        if (activeTool === "rectangle" && rectPreviewRef.current) {
          updateRectanglePreview(canvas, pointer);
          return;
        }
        if (activeTool === "lasso" && lassoPreviewRef.current) {
          updateLassoPreview(canvas, pointer);
        }
      });

      canvas.on("mouse:up", () => {
        const activeTool: EditorTool = spacePressedRef.current ? "pan" : editorToolRef.current;
        if (activeTool === "pan") {
          draggingRef.current = false;
          panStartRef.current = null;
          setCanvasCursorForMode(canvas);
          return;
        }
        if (activeTool === "rectangle") {
          finalizeRectangle(canvas);
          setCanvasCursorForMode(canvas);
          return;
        }
        if (activeTool === "lasso") {
          finalizeLasso(canvas);
          setCanvasCursorForMode(canvas);
        }
      });

      canvas.on("path:created", (opt: any) => {
        const path = opt.path;
        if (!path) return;

        const maskMode: MaskMode = brushToolRef.current === "eraser" ? "erase" : "paint";
        path.set({
          isMask: true,
          maskMode,
          data: { isMask: true, maskMode },
          opacity: brushOpacityRef.current,
          selectable: false,
          evented: false,
        });

        recordHistory(canvas);
      });

      applyInteractionMode(canvas);
      setZoom(1);
    })();

    return () => {
      cancelled = true;
      clearTransientDrawing();
      historyRef.current = [];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [
    applyInteractionMode,
    clearTransientDrawing,
    finalizeLasso,
    finalizeRectangle,
    imageUrl,
    onMaskChange,
    recordHistory,
    setCanvasCursorForMode,
    setCanRedo,
    setCanUndo,
    setZoom,
    startLasso,
    startPan,
    startRectangle,
    updateLassoPreview,
    updatePan,
    updateRectanglePreview,
  ]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    applyInteractionMode(canvas);
    setCanvasCursorForMode(canvas);
  }, [applyInteractionMode, brushOpacity, brushSize, brushTool, editorTool, setCanvasCursorForMode, softEdge]);

  useImperativeHandle(ref, () => ({
    getMaskDataURL: () => {
      const canvas = fabricRef.current;
      if (!canvas) return null;

      if (getMaskObjects(canvas).length === 0) return null;
      const tempEl = renderMaskCanvas(canvas, fabricModuleRef.current);
      return tempEl ? tempEl.toDataURL("image/png") : null;
    },

    clearMask: () => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      clearTransientDrawing(canvas);
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
          clearTransientDrawing(canvas);
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
        clearTransientDrawing(canvas);
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
        clearTransientDrawing(canvas);
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

      clearTransientDrawing(canvas);
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
            Open an image from the gallery and send it here to paint a mask, inpaint, outpaint, or use shape and lasso selections.
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
});

FabricCanvas.displayName = "FabricCanvas";

function renderMaskCanvas(canvas: any, fabric: any) {
  if (!canvas || !fabric) return null;

  const maskObjects = canvas.getObjects().filter((o: any) => Boolean(o?.isMask || o?.maskMode || o?.data?.isMask));
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

    const maskMode = clone.maskMode || clone.data?.maskMode;
    const color = maskMode === "erase" ? "#000000" : "#ffffff";
    clone.set({ fill: color, stroke: color });
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
}

function fabricClone(obj: any): any {
  if (!obj) return null;
  try {
    return obj.clone?.() ?? null;
  } catch {
    return null;
  }
}

export default FabricCanvas;
