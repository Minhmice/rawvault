"use client";

import { useCallback, useEffect, useState } from "react";

const MOBILE_MQ = "(max-width: 767px)";
const TABLET_MAX_MQ = "(max-width: 1023px)";

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("desktop");

  const compute = useCallback(() => {
    if (typeof window === "undefined") return "desktop" as const;
    if (window.matchMedia(MOBILE_MQ).matches) return "mobile";
    if (window.matchMedia(TABLET_MAX_MQ).matches) return "tablet";
    return "desktop";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mMobile = window.matchMedia(MOBILE_MQ);
    const mTablet = window.matchMedia(TABLET_MAX_MQ);
    const update = () => setBp(compute());
    update();
    mMobile.addEventListener("change", update);
    mTablet.addEventListener("change", update);
    return () => {
      mMobile.removeEventListener("change", update);
      mTablet.removeEventListener("change", update);
    };
  }, [compute]);

  return bp;
}
