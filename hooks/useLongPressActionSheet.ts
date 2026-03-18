"use client";

import { useCallback, useState } from "react";
import { useLongPress } from "./useLongPress";

export function useLongPressActionSheet() {
  const [open, setOpen] = useState(false);

  const openSheet = useCallback(() => setOpen(true), []);
  const longPressHandlers = useLongPress(openSheet);

  return {
    actionSheetProps: {
      open,
      onOpenChange: setOpen,
    },
    longPressHandlers,
    openSheet,
    closeSheet: () => setOpen(false),
  };
}
