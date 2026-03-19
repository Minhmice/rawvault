"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Share2, Pencil, Download, Trash2 } from "lucide-react";

import type { ExplorerFile, ExplorerFolder } from "@/lib/contracts";
import type { ActionSheetAction } from "@/components/mobile/ActionSheet";
import { useLongPress } from "@/hooks/useLongPress";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { MessageKey } from "@/lib/i18n/messages";

export type MobileActionSheetTarget =
  | { kind: "folder"; folder: ExplorerFolder }
  | { kind: "file"; file: ExplorerFile };

export function useMobileActionSheet(params: {
  t: (key: MessageKey) => string;
  onShare?: (target: { type: "file" | "folder"; id: string; name: string }) => void;
  onRenameFile?: (id: string, name: string) => void;
  onRenameFolder?: (id: string, name: string) => void;
  onDeleteFile?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string, name: string) => void;
}) {
  const isMobile = useIsMobile();
  const [target, setTarget] = useState<MobileActionSheetTarget | null>(null);

  const pendingRef = useRef<MobileActionSheetTarget | null>(null);
  const suppressNextClickRef = useRef(false);

  const actions: ActionSheetAction[] = (() => {
    if (!target) return [];

    if (target.kind === "folder") {
      const folder = target.folder;
      const out: ActionSheetAction[] = [];

      if (params.onShare) {
        out.push({
          id: "share",
          label: (
            <>
              <Share2 className="h-4 w-4" />
              {params.t("workspace.share")}
            </>
          ),
          onSelect: () => params.onShare?.({ type: "folder", id: folder.id, name: folder.name }),
        });
      }
      if (params.onRenameFolder) {
        out.push({
          id: "rename",
          label: (
            <>
              <Pencil className="h-4 w-4" />
              {params.t("workspace.rename")}
            </>
          ),
          onSelect: () => params.onRenameFolder?.(folder.id, folder.name),
        });
      }
      if (params.onDeleteFolder) {
        out.push({
          id: "delete",
          variant: "destructive",
          label: (
            <>
              <Trash2 className="h-4 w-4" />
              {params.t("workspace.delete")}
            </>
          ),
          onSelect: () => params.onDeleteFolder?.(folder.id, folder.name),
        });
      }
      return out;
    }

    const file = target.file;
    const out: ActionSheetAction[] = [];

    if (params.onShare) {
      out.push({
        id: "share",
        label: (
          <>
            <Share2 className="h-4 w-4" />
            {params.t("workspace.share")}
          </>
        ),
        onSelect: () => params.onShare?.({ type: "file", id: file.id, name: file.name }),
      });
    }
    if (params.onRenameFile) {
      out.push({
        id: "rename",
        label: (
          <>
            <Pencil className="h-4 w-4" />
            {params.t("workspace.rename")}
          </>
        ),
        onSelect: () => params.onRenameFile?.(file.id, file.name),
      });
    }

    out.push({
      id: "download",
      label: (
        <>
          <Download className="h-4 w-4" />
          {params.t("workspace.download")}
        </>
      ),
      onSelect: () => {
        const a = document.createElement("a");
        a.href = `/api/files/${file.id}/download`;
        a.download = file.name;
        a.click();
      },
    });

    if (params.onDeleteFile) {
      out.push({
        id: "delete",
        variant: "destructive",
        label: (
          <>
            <Trash2 className="h-4 w-4" />
            {params.t("workspace.delete")}
          </>
        ),
        onSelect: () => params.onDeleteFile?.(file.id, file.name),
      });
    }

    return out;
  })();

  const longPress = useLongPress(() => {
    const p = pendingRef.current;
    if (!p) return;

    if (p.kind === "folder" && !params.onShare && !params.onRenameFolder && !params.onDeleteFolder) {
      return;
    }

    suppressNextClickRef.current = true;
    setTarget(p);
  });

  const bindLongPress = (next: MobileActionSheetTarget) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      pendingRef.current = next;
      longPress.onPointerDown(e);
    },
    onPointerUp: longPress.onPointerUp,
    onPointerCancel: longPress.onPointerCancel,
    onPointerMove: longPress.onPointerMove,
  });

  const guardClick = <T extends unknown[]>(fn: (...args: T) => void) => {
    return (...args: T) => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }
      fn(...args);
    };
  };

  return {
    isMobile,
    bindLongPress,
    guardClick,
    sheet: {
      open: target != null && actions.length > 0,
      title:
        target?.kind === "folder"
          ? target.folder.name
          : target?.kind === "file"
            ? target.file.name
            : undefined,
      actions,
      onOpenChange: (open: boolean) => {
        if (!open) setTarget(null);
      },
    },
  };
}

