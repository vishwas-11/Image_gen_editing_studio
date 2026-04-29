"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Images, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { collectionsApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { Collection } from "@/types";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  imageIds: string[];
  onAdded?: () => void;
}

export function AddToCollectionDialog({
  open,
  onOpenChange,
  collections,
  imageIds,
  onAdded,
}: AddToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedCollectionId((current) => current || collections[0]?.id || "");
  }, [collections, open]);

  const handleAdd = async () => {
    if (!selectedCollectionId || imageIds.length === 0) return;

    setSubmitting(true);
    try {
      await collectionsApi.addImages(selectedCollectionId, imageIds);
      const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId);
      toast.success(
        imageIds.length === 1
          ? `Added to ${selectedCollection?.name ?? "collection"}`
          : `Added ${imageIds.length} images to ${selectedCollection?.name ?? "collection"}`
      );
      onAdded?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-white">
            <FolderPlus size={16} className="text-studio-blue" />
            Add to collection
          </DialogTitle>
          <DialogDescription>
            Choose where to save this generated image.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {collections.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-studio-border bg-black/40 px-4 py-5">
              <Images size={16} className="text-studio-subtle" />
              <div>
                <p className="font-display text-sm text-white">No collections yet</p>
                <p className="mt-1 font-mono text-[11px] text-studio-subtle">
                  Create a collection first, then come back to add images to it.
                </p>
              </div>
            </div>
          ) : (
            collections.map((collection) => {
              const active = collection.id === selectedCollectionId;

              return (
                <button
                  key={collection.id}
                  type="button"
                  onPointerDown={() => setSelectedCollectionId(collection.id)}
                  onClick={() => setSelectedCollectionId(collection.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    active
                      ? "border-studio-blue/60 bg-studio-blue/15 shadow-[0_0_0_1px_rgba(14,165,233,0.18)]"
                      : "border-studio-border bg-black/40 hover:border-studio-blue/40 hover:bg-black/60"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-sm text-white">{collection.name}</p>
                      {active && <Badge variant="blue" className="h-5 rounded-full px-2 py-0 text-[10px]">Selected</Badge>}
                    </div>
                    {collection.description && (
                      <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-relaxed text-studio-subtle/80">
                        {collection.description}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full border border-studio-border bg-black px-2 py-0.5 font-mono text-[10px] text-studio-subtle">
                    {collection.image_count}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <p className="font-mono text-[11px] text-studio-subtle">
            {imageIds.length === 1 ? "1 image selected" : `${imageIds.length} images selected`}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!collections.length || !selectedCollectionId || submitting}
              className="gap-2"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <FolderPlus size={12} />}
              Add
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
