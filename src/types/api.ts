export type PreviewStatus = "pending" | "processing" | "ready" | "failed";

export interface FileItem {
  id: string;
  name: string;
  ext: string;
  mime: string;
  size_bytes: number;
  preview_status: PreviewStatus;
  error_code: string | null;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
}

export interface ListFilesResponse {
  data: FileItem[];
  total: number;
  hasMore: boolean;
}

export interface FolderItem {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  created_at: string;
  updated_at?: string;
}

export interface SignedUrlResponse {
  url: string | null;
  variant: "thumb" | "preview" | "original";
  expiresIn?: number;
}

export interface ShareResponse {
  link: string;
  expiresIn: number;
}
