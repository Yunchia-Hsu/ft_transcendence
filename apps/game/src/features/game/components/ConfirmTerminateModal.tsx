// apps/game/src/features/pong/ConfirmTerminateModal.tsx
import React from "react";

export function ConfirmTerminateModal({
  visible,
  scoreA,
  scoreB,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  scoreA: number;
  scoreB: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!visible) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(92vw, 520px)",
          borderRadius: 16,
          background: "#121416",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 20,
          color: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div
          id="confirm-title"
          style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}
        >
          Terminate this match?
        </div>
        <div style={{ opacity: 0.9, marginBottom: 16, lineHeight: 1.5 }}>
          The current score{" "}
          <b>
            {scoreA} - {scoreB}
          </b>{" "}
          will be saved and the game will be marked as <b>Terminated</b>. This
          cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 10,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: "#EF4444",
              border: "none",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 10,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Yes, terminate
          </button>
        </div>
      </div>
    </div>
  );
}
