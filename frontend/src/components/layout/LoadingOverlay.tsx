"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  sub?: string;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  message = "Generating...",
  sub,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center",
        "rounded-lg bg-black/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-ping rounded-full border-2 border-studio-blue/20" />
          <div className="absolute inset-2 animate-ping rounded-full border-2 border-studio-blue/40 [animation-delay:0.2s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={22} className="animate-pulse text-studio-blue" />
          </div>
        </div>

        <div className="text-center">
          <p className="font-display text-sm text-white">{message}</p>
          {sub && (
            <p className="mt-1 font-mono text-xs text-studio-subtle">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}
