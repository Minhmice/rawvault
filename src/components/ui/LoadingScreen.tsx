"use client";

import { useEffect, useState } from "react";
import { useLoadingOverlay } from "@/components/ui/LoadingOverlayContext";

const MIN_DWELL_MS = 600;
const FADE_DURATION_MS = 500;

export function LoadingScreen() {
  const { sessionLoading, filesLoading } = useLoadingOverlay();
  const [minDwellActive, setMinDwellActive] = useState(true);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const isLocked = sessionLoading || filesLoading;

  useEffect(() => {
    if (isLocked) {
      setMinDwellActive(true);
      setFading(false);
      setHidden(false);
      return;
    }
    if (!minDwellActive) {
      setFading(true);
      const hideTimer = setTimeout(() => setHidden(true), FADE_DURATION_MS);
      return () => clearTimeout(hideTimer);
    }
    const dwellTimer = setTimeout(() => setMinDwellActive(false), MIN_DWELL_MS);
    return () => clearTimeout(dwellTimer);
  }, [isLocked, minDwellActive]);

  const shouldShow = (isLocked || minDwellActive) && !hidden;

  if (!shouldShow) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-out"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "all" }}
    >
      {/* Slow-spinning SVG ring */}
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <svg
          width={72}
          height={72}
          viewBox="0 0 72 72"
          style={{ animation: "rv-spin 1.8s linear infinite" }}
        >
          {/* Track */}
          <circle cx={36} cy={36} r={30} fill="none" stroke="var(--border)" strokeWidth={4} />
          {/* Indicator */}
          <circle
            cx={36} cy={36} r={30}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray="60 128"
          />
        </svg>

        {/* Brand mark */}
        <div
          className="absolute inset-0 flex items-center justify-center font-heading text-[13px] font-black tracking-[0.2em] text-foreground"
        >
          RV
        </div>
      </div>

      {/* Word mark */}
      <p className="mt-5 font-heading text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
        RAWVAULT
      </p>

      <style>{`
        @keyframes rv-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
