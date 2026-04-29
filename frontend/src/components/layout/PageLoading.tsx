export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-studio-blue/30 border-t-studio-blue" />
        <span className="font-mono text-xs text-studio-subtle">Loading...</span>
      </div>
    </div>
  );
}
