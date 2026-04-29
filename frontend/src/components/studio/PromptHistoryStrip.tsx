"use client";

import { Clock } from "lucide-react";

import { truncate } from "@/lib/utils";
import type { PromptHistoryEntry } from "@/store/generationStore";

interface PromptHistoryStripProps {
  history: PromptHistoryEntry[];
  onSelect: (prompt: string) => void;
}

export function PromptHistoryStrip({
  history,
  onSelect,
}: PromptHistoryStripProps) {
  if (history.length === 0) return null;

  const orderedHistory = [...history].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Clock size={11} className="text-studio-subtle" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-studio-subtle">
          Recent prompts
        </span>
      </div>
      <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {orderedHistory.slice(0, 12).map((entry, index) => (
          <button
            key={`${entry.createdAt}-${index}-${entry.prompt}`}
            onClick={() => onSelect(entry.prompt)}
            className="studio-chip flex w-full items-start gap-3 rounded-xl border border-white/8 bg-[#121212ea] px-3 py-2.5 text-left font-mono text-xs text-studio-subtle hover:border-studio-blue/45 hover:text-white"
            title={entry.prompt}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-[10px] font-medium text-studio-subtle/80">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 leading-5">
              {truncate(entry.prompt, 64)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
