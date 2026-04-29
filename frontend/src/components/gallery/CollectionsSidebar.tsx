"use client";
import Link from "next/link";
import { FolderPlus, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { Collection } from "@/types";

interface CollectionsSidebarProps {
  collections: Collection[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onCreate?: () => void;
  className?: string;
}

export default function CollectionsSidebar({
  collections,
  activeId = null,
  onSelect,
  onCreate,
  className,
}: CollectionsSidebarProps) {
  return (
    <aside className={cn("flex flex-col gap-4 rounded-xl border border-studio-border bg-studio-surface p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-studio-subtle">Collections</p>
          <p className="mt-1 font-display text-sm text-white">Organize saved work</p>
        </div>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-studio-border text-studio-subtle transition-colors hover:border-studio-blue/50 hover:text-white"
            aria-label="Create collection"
          >
            <FolderPlus size={14} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {collections.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-studio-border px-3 py-4 text-studio-subtle">
            <ImageIcon size={14} />
            <p className="font-mono text-xs">No collections yet</p>
          </div>
        ) : (
          collections.map((collection) => {
            const active = collection.id === activeId;
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm text-white">{collection.name}</p>
                  {collection.description && (
                    <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-studio-subtle/80">
                      {collection.description}
                    </p>
                  )}
                </div>
                <span className="rounded-full border border-studio-border bg-black px-2 py-0.5 font-mono text-[10px] text-studio-subtle">
                  {collection.image_count}
                </span>
              </>
            );

            if (onSelect) {
              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => onSelect(collection.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-studio-blue bg-studio-blue/10"
                      : "border-studio-border bg-black/40 hover:border-studio-blue/40 hover:bg-black/60"
                  )}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={collection.id}
                href={ROUTES.COLLECTION(collection.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  active
                    ? "border-studio-blue bg-studio-blue/10"
                    : "border-studio-border bg-black/40 hover:border-studio-blue/40 hover:bg-black/60"
                )}
              >
                {content}
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
