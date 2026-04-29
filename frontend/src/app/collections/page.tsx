"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Trash2, Images } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard, PageLoading, EmptyState } from "@/components/shared/index";
import { Button } from "@/components/ui/button";
import { collectionsApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { Collection } from "@/types";

export default function CollectionsPage() {
  return <AuthGuard><CollectionsContent /></AuthGuard>;
}

function CollectionsContent() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [newName, setNewName]         = useState("");

  useEffect(() => {
    collectionsApi.list()
      .then(setCollections)
      .catch(() => toast.error("Failed to load collections"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const col = await collectionsApi.create({ name: newName.trim() });
      setCollections((p) => [col, ...p]);
      setNewName(""); setCreating(false);
      toast.success(`"${col.name}" created`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? Images will not be deleted.`)) return;
    try {
      await collectionsApi.delete(id);
      setCollections((p) => p.filter((c) => c.id !== id));
      toast.success("Collection deleted");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Collections</h1>
          <p className="font-mono text-xs text-studio-subtle mt-1">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus size={14} /> New Collection
        </Button>
      </div>

      {/* Inline create form */}
      {creating && (
        <div className="mb-6 p-4 rounded-xl border border-studio-blue/40 bg-studio-surface flex items-center gap-3 animate-slide-down">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Collection name…"
            className="flex-1 bg-black border border-studio-border rounded-md px-3 py-2 font-mono text-sm text-white placeholder:text-studio-subtle focus:outline-none focus:ring-1 focus:ring-studio-blue"
          />
          <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewName(""); }}>Cancel</Button>
        </div>
      )}

      {loading ? (
        <PageLoading />
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={24} />}
          title="No collections yet"
          description="Create a collection to organise your generated images"
          action={<Button onClick={() => setCreating(true)} className="gap-2"><Plus size={14} />New Collection</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => router.push(ROUTES.COLLECTION(col.id))}
              className="group relative rounded-xl border border-studio-border bg-studio-surface hover:border-studio-blue/50 cursor-pointer transition-all duration-200 overflow-hidden"
            >
              {/* Cover */}
              <div className="h-36 bg-studio-hover flex items-center justify-center overflow-hidden">
                {col.cover_image_url ? (
                  <img src={col.cover_image_url} alt={col.name} className="w-full h-full object-cover" />
                ) : (
                  <FolderOpen size={32} className="text-studio-border" />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-display text-base text-white truncate">{col.name}</h3>
                {col.description && (
                  <p className="font-mono text-xs text-studio-subtle mt-0.5 truncate">{col.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-studio-subtle">
                    <Images size={11} /> {col.image_count} image{col.image_count !== 1 ? "s" : ""}
                  </div>
                  <span className="font-mono text-[10px] text-studio-subtle/60">{formatDate(col.created_at)}</span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => handleDelete(col.id, col.name, e)}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 flex items-center justify-center text-studio-subtle hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}