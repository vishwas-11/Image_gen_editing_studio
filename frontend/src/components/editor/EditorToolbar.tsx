"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Maximize, Redo2, Trash2, Undo2, ZoomIn, ZoomOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onClearMask: () => void;
  zoom: number;
}

export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onClearMask,
  zoom,
}: EditorToolbarProps) {
  const router = useRouter();

  return (
    <div className="flex h-12 flex-shrink-0 items-center gap-2 border-b border-studio-border bg-black px-3">
      <Button variant="ghost" size="icon-sm" onClick={() => router.push(ROUTES.STUDIO)}>
        <ArrowLeft size={14} />
      </Button>

      <div className="mx-1 h-5 w-px bg-studio-border" />

      <ToolbarBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <Redo2 size={14} />
      </ToolbarBtn>

      <div className="mx-1 h-5 w-px bg-studio-border" />

      <ToolbarBtn onClick={onZoomOut} title="Zoom Out">
        <ZoomOut size={14} />
      </ToolbarBtn>
      <span className="w-10 text-center font-mono text-xs text-studio-subtle">
        {Math.round(zoom * 100)}%
      </span>
      <ToolbarBtn onClick={onZoomIn} title="Zoom In">
        <ZoomIn size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={onFitScreen} title="Fit to Screen">
        <Maximize size={14} />
      </ToolbarBtn>

      <div className="mx-1 h-5 w-px bg-studio-border" />

      <ToolbarBtn
        onClick={onClearMask}
        title="Clear mask"
        className="text-red-400 hover:text-red-300"
      >
        <Trash2 size={14} />
      </ToolbarBtn>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  disabled,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded transition-all duration-150",
        "text-studio-subtle hover:bg-studio-hover hover:text-white",
        "disabled:cursor-not-allowed disabled:opacity-30",
        className
      )}
    >
      {children}
    </button>
  );
}

export default EditorToolbar;
