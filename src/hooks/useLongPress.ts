"use client";

import { useCallback, useRef } from "react";

export type LongPressHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
};

export type UseLongPressOptions = {
  delay?: number;
  threshold?: number;
};

export function useLongPress(
  callback: () => void,
  options: UseLongPressOptions = {}
): LongPressHandlers {
  const { delay = 500, threshold = 10 } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const cancelledRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      cancelledRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (!cancelledRef.current) {
          callback();
        }
        timerRef.current = null;
      }, delay);
    },
    [callback, delay, clearTimer]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current || timerRef.current == null) return;
      const dx = Math.abs(e.clientX - startRef.current.x);
      const dy = Math.abs(e.clientY - startRef.current.y);
      if (dx > threshold || dy > threshold) {
        cancelledRef.current = true;
        clearTimer();
      }
    },
    [threshold, clearTimer]
  );

  const onPointerUp = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    startRef.current = null;
  }, [clearTimer]);

  const onPointerCancel = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    startRef.current = null;
  }, [clearTimer]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerMove,
  };
}
