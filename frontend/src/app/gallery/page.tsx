"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Images } from "lucide-react";
import { AuthGuard, EmptyState, PageLoading } from "@/components/shared/index";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";
import { SearchBar, FilterPanel, CollectionsSidebar, MultiSelectBar, AddToCollectionDialog } from "@/components/gallery";
import { Button, ConfirmDialog } from "@/components/ui";
import { useGalleryStore } from "@/store/galleryStore";
import { galleryApi, collectionsApi, downloadApi } from "@/lib/api/gallery";
import { getErrorMessage } from "@/lib/api/client";
import { useDebounce } from "@/hooks";
import type { GalleryFilters } from "@/types";

export default function GalleryPage() {
  return <AuthGuard><GalleryContent /></AuthGuard>;
}

function GalleryContent() {
  const store = useGalleryStore();
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [page, setPage] = useState(1);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [imageToAddId, setImageToAddId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "single"; id: string } | { type: "bulk" } | null>(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  // Initial load
  const fetchImages = useCallback(async (overrides: Partial<GalleryFilters> = {}) => {
    store.setLoading(true);
    try {
      const filters = { ...store.filters, ...overrides };
      const res = await galleryApi.list(filters);
      if (overrides.page && overrides.page > 1) {
        store.appendImages(res.items);
      } else {
        store.setImages(res.items, res.total, res.total_pages);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const cols = await collectionsApi.list();
      store.setCollections(cols);
    } catch {}
    setCollectionsLoading(false);
  }, [store]);

  useEffect(() => { fetchImages(); fetchCollections(); }, []);

  // Re-fetch on search debounce
  useEffect(() => {
    fetchImages({ search: debouncedSearch || undefined, page: 1 });
    setPage(1);
  }, [debouncedSearch]);

  const handleFilterChange = (f: Partial<GalleryFilters>) => {
    store.setFilters(f);
    fetchImages({ ...f, page: 1 });
    setPage(1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchImages({ page: next });
  };

  const handleDelete = (id: string) => {
    setDeleteTarget({ type: "single", id });
  };

  const performDelete = async (id: string) => {
    try {
      await galleryApi.delete(id);
      store.removeImage(id);
      toast.success("Deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ type: "bulk" });
  };

  const performBulkDelete = async () => {
    for (const id of store.selected) {
      try { await galleryApi.delete(id); store.removeImage(id); } catch {}
    }
    store.clearSelected();
    toast.success("Deleted selected images");
  };

  const handleBulkDownload = async () => {
    try {
      toast.info("Preparing ZIP...");
      const blob = await downloadApi.batchDownload([...store.selected]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "ai_studio_batch.zip"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCreateCollection = async () => {
    if (!newColName.trim()) return;
    try {
      const col = await collectionsApi.create({ name: newColName });
      store.addCollection(col);
      setNewColName(""); setShowCreateModal(false);
      toast.success(`Collection "${col.name}" created`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAddToCollection = (imageId: string) => {
    setImageToAddId(imageId);
    setShowAddToCollection(true);
  };

  const hasActiveFilters = !!(store.filters.style || store.filters.operation || store.filters.is_favorite || store.filters.aspect_ratio);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Collections sidebar */}
      <aside className="w-52 flex-shrink-0 border-r border-studio-border bg-black">
        <CollectionsSidebar
          collections={store.collections}
          activeId={activeCollectionId ?? undefined}
          onSelect={(id) => {
            setActiveCollectionId(id);
            fetchImages(id ? {} : {});
          }}
          onCreate={() => setShowCreateModal(true)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-studio-border p-4 flex flex-col gap-3 flex-shrink-0 bg-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl text-white">Gallery</h1>
              <p className="font-mono text-xs text-studio-subtle mt-0.5">
                {store.total} image{store.total !== 1 ? "s" : ""}
                {hasActiveFilters && " (filtered)"}
              </p>
            </div>
          </div>
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onFilterToggle={() => setShowFilters(!showFilters)}
            hasActiveFilters={hasActiveFilters}
          />
          {showFilters && (
            <FilterPanel
              filters={store.filters}
              onChange={handleFilterChange}
              onClear={() => { store.clearFilters(); fetchImages({ page: 1 }); }}
            />
          )}
        </div>

        {/* Images */}
        <div className="flex-1 overflow-y-auto p-4">
          {store.isLoading && store.images.length === 0 ? (
            <PageLoading />
          ) : store.images.length === 0 ? (
            <EmptyState
              icon={<Images size={24} />}
              title="No images yet"
              description="Generate your first image in the Studio to see it here"
            />
          ) : (
            <MasonryGrid
              images={store.images}
              selected={store.selected}
              onToggleSelect={store.toggleSelected}
              onFavoriteChange={(id, val) => store.updateImage(id, { is_favorite: val })}
              onDelete={handleDelete}
              onAddToCollection={handleAddToCollection}
            />
          )}

          {/* Load more */}
          {page < store.totalPages && (
            <div className="flex justify-center mt-8 mb-4">
              <Button variant="outline" onClick={handleLoadMore} loading={store.isLoading}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-select action bar */}
      <MultiSelectBar
        count={store.selected.size}
        onClear={store.clearSelected}
        onSelectAll={store.selectAll}
        onDelete={handleBulkDelete}
        onDownload={handleBulkDownload}
      />

      {/* Create collection modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-studio-surface border border-studio-border rounded-xl p-6 w-80 animate-scale-in">
            <h3 className="font-display text-lg text-white mb-4">New Collection</h3>
            <input
              autoFocus
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
              placeholder="Collection name"
              className="w-full bg-black border border-studio-border rounded-md px-3 py-2 font-mono text-sm text-white placeholder:text-studio-subtle focus:outline-none focus:ring-1 focus:ring-studio-blue mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateCollection} disabled={!newColName.trim()}>Create</Button>
            </div>
          </div>
        </div>
      )}

      <AddToCollectionDialog
        open={showAddToCollection}
        onOpenChange={(open) => {
          setShowAddToCollection(open);
          if (!open) setImageToAddId(null);
        }}
        collections={store.collections}
        imageIds={imageToAddId ? [imageToAddId] : []}
        onAdded={fetchCollections}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget?.type === "bulk" ? "Delete selected images?" : "Delete image?"}
        description={
          deleteTarget?.type === "bulk"
            ? `This will permanently delete ${store.selected.size} image${store.selected.size === 1 ? "" : "s"}. This action cannot be undone.`
            : "This will permanently delete the selected image from your gallery. This action cannot be undone."
        }
        confirmLabel={deleteTarget?.type === "bulk" ? "Delete images" : "Delete image"}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "single") {
            await performDelete(deleteTarget.id);
          } else {
            await performBulkDelete();
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
