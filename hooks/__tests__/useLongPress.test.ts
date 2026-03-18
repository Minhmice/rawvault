import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLongPress } from "../useLongPress";

function pe(clientX = 0, clientY = 0): React.PointerEvent {
  return {
    clientX,
    clientY,
    pointerId: 1,
  } as React.PointerEvent;
}

describe("useLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires callback after delay", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, { delay: 500 }));

    act(() => {
      result.current.onPointerDown(pe(0, 0));
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cancels on pointer up before delay", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb));

    act(() => {
      result.current.onPointerDown(pe());
      result.current.onPointerUp(pe());
      vi.advanceTimersByTime(500);
    });
    expect(cb).not.toHaveBeenCalled();
  });

  it("cancels when pointer moves beyond threshold", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, { threshold: 10 }));

    act(() => {
      result.current.onPointerDown(pe(0, 0));
      result.current.onPointerMove(pe(20, 0));
      vi.advanceTimersByTime(500);
    });
    expect(cb).not.toHaveBeenCalled();
  });
});
