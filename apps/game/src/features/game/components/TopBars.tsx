// apps/game/src/features/pong/TopBars.tsx
import React from "react";
import { getStrategyColors } from "./PongConstants";

export function AIBadge({
  mode,
  strategy,
  pulse,
}: {
  mode: "ai" | "human";
  strategy: string;
  pulse: number;
}) {
  if (mode !== "ai") return null;
  const strategyColors = getStrategyColors(strategy);
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: `translateX(-50%) scale(${pulse ? 1.05 : 1})`,
        transition: "transform 200ms ease",
        background: strategyColors.chipBg,
        color: strategyColors.chipText,
        border: `1px solid ${strategyColors.chipBorder}`,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.4,
        zIndex: 6,
      }}
      title="AI strategy adapts during the match"
    >
      AI: {strategy}
    </div>
  );
}

export function MenuButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: 10,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        zIndex: 6,
      }}
      title="Go back to the main menu"
    >
      ← Menu
    </button>
  );
}

export function TerminateButton({
  visible,
  onClick,
  disabled,
}: {
  visible: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: "#EF4444",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "8px 12px",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        zIndex: 6,
      }}
      title="Stop this match early and save as Terminated"
    >
      Terminate Match
    </button>
  );
}
