"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50);
  const hasImages = Boolean(beforeUrl && afterUrl);

  return (
    <div className="flex flex-col gap-3 border-t border-studio-border p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-studio-subtle">
          Compare
        </span>
        <span className="font-mono text-xs text-studio-subtle">{pos}%</span>
      </div>

      <div
        className="relative cursor-col-resize select-none overflow-hidden rounded-lg border border-studio-border bg-studio-surface"
        style={{ userSelect: "none" }}
      >
        <div className="aspect-[4/3] w-full">
          {hasImages ? (
            <>
              <img
                src={afterUrl as string}
                alt="After"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
              >
                <img
                  src={beforeUrl as string}
                  alt="Before"
                  className="h-full w-full object-cover"
                />
              </div>

              <div
                className="absolute bottom-0 top-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${pos}%` }}
              >
                <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path
                      d="M5 3L1 8l4 5M11 3l4 5-4 5"
                      stroke="#000"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white">
                Before
              </div>
              <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white">
                After
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center">
              <p className="font-mono text-xs leading-relaxed text-studio-subtle">
                Add before and after images to compare results here.
              </p>
            </div>
          )}
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className={cn(
            "absolute inset-0 h-full w-full cursor-col-resize opacity-0",
            "appearance-none"
          )}
        />
      </div>
    </div>
  );
}

export default BeforeAfterSlider;
