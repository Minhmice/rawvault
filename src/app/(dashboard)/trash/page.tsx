export default function TrashPage() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
      <p className="text-zinc-500">Trash</p>
      <p className="mt-1 text-sm text-zinc-600">
        Deleted files and folders. Recover or empty trash when the API supports listing deleted items.
      </p>
    </div>
  );
}
