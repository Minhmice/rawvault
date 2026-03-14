"use client";

import { useEffect, useState } from "react";

export function LoadingScreen() {
  // Two-phase: 'showing' controls render, 'fading' controls opacity
  const [fading, setFading]   = useState(false);
  const [hidden, setHidden]   = useState(false);

  useEffect(() => {
    // This fires ONLY after the full React tree has hydrated on the client.
    // Add a small minimum dwell (~600ms) so the animation reads as intentional.
    const fadeTimer = setTimeout(() => setFading(true),  600);
    // Remove from DOM after the CSS transition finishes (500ms fade-out)
    const hideTimer = setTimeout(() => setHidden(true), 1200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        transition:     "opacity 0.5s ease-out",
        opacity:        fading ? 0 : 1,
        pointerEvents:  fading ? "none" : "all",
      }}
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
          <circle cx={36} cy={36} r={30} fill="none" stroke="#e5e5e5" strokeWidth={4} />
          {/* Indicator */}
          <circle
            cx={36} cy={36} r={30}
            fill="none"
            stroke="#000"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray="60 128"
          />
        </svg>

        {/* Brand mark */}
        <div style={{
          position:       "absolute",
          inset:          0,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontFamily:     "var(--font-outfit, 'Outfit', sans-serif)",
          fontWeight:     900,
          fontSize:       13,
          letterSpacing:  "0.2em",
          color:          "#000",
        }}>
          RV
        </div>
      </div>

      {/* Word mark */}
      <p style={{
        marginTop:      20,
        fontFamily:     "var(--font-outfit, 'Outfit', sans-serif)",
        fontSize:       10,
        fontWeight:     700,
        letterSpacing:  "0.35em",
        textTransform:  "uppercase",
        color:          "#9ca3af",
      }}>
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
