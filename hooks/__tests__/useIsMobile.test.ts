import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useIsMobile, useBreakpoint } from "../useIsMobile";

function mockMatchMedia(matchesMobile: boolean, matchesTablet = false) {
  return vi.fn().mockImplementation((query: string) => ({
    matches:
      query.includes("767px") ? matchesMobile : query.includes("1023px") ? matchesTablet : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("useIsMobile", () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  it("returns false when viewport is wide", () => {
    window.matchMedia = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when under 768px", async () => {
    window.matchMedia = mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("updates on resize", async () => {
    let mobile = false;
    const listeners: Array<() => void> = [];
    window.matchMedia = vi.fn().mockImplementation(() => ({
      get matches() {
        return mobile;
      },
      media: "",
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      },
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    mobile = true;
    act(() => {
      listeners.forEach((fn) => fn());
    });
    await waitFor(() => expect(result.current).toBe(true));
  });
});

describe("useBreakpoint", () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  it("returns mobile when max-width 767 matches", async () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes("767px"),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useBreakpoint());
    await waitFor(() => expect(result.current).toBe("mobile"));
  });
});
