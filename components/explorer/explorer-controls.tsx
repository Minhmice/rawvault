import type { ChangeEvent } from "react";

import type {
  AccountProvider,
  FilePreviewStatus,
  FileSortBy,
  SortOrder,
} from "@/lib/contracts";

type ProviderFilter = AccountProvider | "all";
import { Button } from "../ui/button";

type ExplorerControlsProps = {
  search: string;
  provider: ProviderFilter;
  previewStatus: FilePreviewStatus | "all";
  sortBy: FileSortBy;
  sortOrder: SortOrder;
  onSearchChange: (value: string) => void;
  onProviderChange: (value: ProviderFilter) => void;
  onPreviewStatusChange: (value: FilePreviewStatus | "all") => void;
  onSortByChange: (value: FileSortBy) => void;
  onSortOrderChange: (value: SortOrder) => void;
  onReset: () => void;
};

function readInputValue(event: ChangeEvent<HTMLInputElement>) {
  return event.currentTarget.value;
}

function readSelectValue<T extends string>(event: ChangeEvent<HTMLSelectElement>) {
  return event.currentTarget.value as T;
}

export function ExplorerControls({
  search,
  provider,
  previewStatus,
  sortBy,
  sortOrder,
  onSearchChange,
  onProviderChange,
  onPreviewStatusChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
}: ExplorerControlsProps) {
  return (
    <section className="rv-explorer-controls" aria-label="Explorer sorting and filtering">
      <label className="rv-field">
        <span className="rv-field-label">Search</span>
        <input
          className="rv-input"
          type="search"
          placeholder="Search by file name..."
          value={search}
          onChange={(event) => onSearchChange(readInputValue(event))}
        />
      </label>

      <label className="rv-field">
        <span className="rv-field-label">Provider</span>
        <select
          className="rv-select"
          value={provider}
          onChange={(event) =>
            onProviderChange(readSelectValue<ProviderFilter>(event))
          }
        >
          <option value="all">All providers</option>
          <option value="gdrive">Google Drive</option>
          <option value="onedrive">OneDrive</option>
        </select>
      </label>

      <label className="rv-field">
        <span className="rv-field-label">Preview</span>
        <select
          className="rv-select"
          value={previewStatus}
          onChange={(event) =>
            onPreviewStatusChange(
              readSelectValue<FilePreviewStatus | "all">(event),
            )
          }
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
      </label>

      <label className="rv-field">
        <span className="rv-field-label">Sort by</span>
        <select
          className="rv-select"
          value={sortBy}
          onChange={(event) => onSortByChange(readSelectValue<FileSortBy>(event))}
        >
          <option value="updatedAt">Updated</option>
          <option value="createdAt">Created</option>
          <option value="name">Name</option>
          <option value="sizeBytes">Size</option>
        </select>
      </label>

      <label className="rv-field">
        <span className="rv-field-label">Order</span>
        <select
          className="rv-select"
          value={sortOrder}
          onChange={(event) => onSortOrderChange(readSelectValue<SortOrder>(event))}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>

      <div className="rv-field">
        <span className="rv-field-label">Filters</span>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset controls
        </Button>
      </div>
    </section>
  );
}
