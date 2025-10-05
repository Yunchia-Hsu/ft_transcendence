// apps/game/src/features/pong/PostgameOverlay.tsx
import React from "react";

export function PostgameOverlay({
  visible,
  terminated,
  scoreA,
  scoreB,
  goToMenu,
  onPrimary,
  primaryDisabled,
  primaryLabel,
  showStartNew,
}: {
  visible: boolean;
  terminated: boolean;
  scoreA: number;
  scoreB: number;
  goToMenu: () => void;
  onPrimary: () => void;
  primaryDisabled: boolean;
  primaryLabel: string;
  showStartNew: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: "min(92vw, 640px)",
          borderRadius: 16,
          background: "rgba(16,16,16,0.7)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 24,
          backdropFilter: "blur(6px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          {terminated ? "Match Terminated" : "Match Over"}
        </div>
        <div style={{ opacity: 0.9, marginBottom: 14 }}>
          Final Score:{" "}
          <b>
            {scoreA} - {scoreB}
          </b>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={goToMenu}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ← Menu
          </button>

          {showStartNew && (
            <button
              onClick={onPrimary}
              disabled={primaryDisabled}
              style={{
                background: terminated ? "#EF4444" : "#10B981",
                border: "none",
                padding: "10px 20px",
                color: "white",
                fontSize: 16,
                cursor: primaryDisabled ? "not-allowed" : "pointer",
                borderRadius: 10,
                fontWeight: 900,
                opacity: primaryDisabled ? 0.6 : 1,
              }}
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
