// apps/game/src/features/pong/PregameOverlay.tsx
import React from "react";
import { WIN_SCORE } from "./PongConstants";
import { getStrategyColors } from "./PongConstants";
import type { BallSkin, GameMode } from "./PongTypes";

export function PregameOverlay({
  visible,
  countdown,
  gameMode,
  aiStrategy,
  aiDifficulty,
  onDifficulty,
  onPrimary,
  primaryDisabled,
  primaryLabel,
  goToMenu,
  opponentLabel,
  ballSkin,
  setBallSkin,
}: {
  visible: boolean;
  countdown: number | null;
  gameMode: GameMode;
  aiStrategy: string;
  aiDifficulty: number;
  onDifficulty: (n: number) => void;
  onPrimary: () => void;
  primaryDisabled: boolean;
  primaryLabel: string;
  goToMenu: () => void;
  opponentLabel: string;
  ballSkin: BallSkin;
  setBallSkin: (s: BallSkin) => void;
}) {
  if (!visible) return null;
  const strategyColors = getStrategyColors(aiStrategy);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          countdown !== null
            ? "linear-gradient(135deg, #FFE29F 0%, #FFA99F 48%, #FAD0C4 100%)"
            : "linear-gradient(135deg, #D8FFEE 0%, #E0EAFF 50%, #FFE6F7 100%)",
        color: "#111",
        display: "grid",
        placeItems: "center",
        transition: "opacity 200ms ease",
        opacity: 1,
        zIndex: 10,
      }}
    >
      {countdown !== null ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 94,
              fontWeight: 900,
              letterSpacing: 2,
              color: "#111",
              textShadow: "0 2px 0 rgba(255,255,255,0.5)",
            }}
          >
            {countdown}
          </div>
          <div style={{ opacity: 0.85, marginTop: 12, fontSize: 18 }}>
            Get ready…
          </div>
        </div>
      ) : (
        <div
          style={{
            width: "min(92vw, 760px)",
            borderRadius: 16,
            background: "rgba(255,255,255,0.66)",
            border: "1px solid rgba(0,0,0,0.08)",
            padding: 24,
            backdropFilter: "blur(8px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#111" }}>
                Pong
              </span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  background:
                    gameMode === "ai"
                      ? strategyColors.chipBg
                      : "rgba(99,102,241,0.18)",
                  color:
                    gameMode === "ai" ? strategyColors.chipText : "#6366F1",
                  border:
                    gameMode === "ai"
                      ? `1px solid ${strategyColors.chipBorder}`
                      : "1px solid #6366F1",
                }}
                title="Mode is based on how you started the match"
              >
                {gameMode === "ai" ? `vs AI • ${aiStrategy}` : "vs Human"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={goToMenu}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.2)",
                  color: "#111",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ← Menu
              </button>
              <button
                onClick={onPrimary}
                disabled={primaryDisabled}
                style={{
                  background: "#FF8C00",
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
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* Controls */}
            <div
              style={{
                borderRadius: 12,
                background: "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.08)",
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8, color: "#111" }}>
                Controls
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#222" }}>
                <div>
                  Player 1: <b>W / S</b>
                </div>
                {gameMode === "human" ? (
                  <div>
                    Player 2: <b>Arrow ↑ / ↓</b>
                  </div>
                ) : (
                  <div>
                    Player 2: <b>AI controlled</b>
                  </div>
                )}
                <div>
                  Power-up: <b>Space</b>
                </div>
                <div>
                  Target score: <b>{WIN_SCORE}</b>
                </div>
              </div>
            </div>

            {/* Settings + Ball */}
            <div
              style={{
                borderRadius: 12,
                background:
                  gameMode === "ai"
                    ? strategyColors.panelBg
                    : "rgba(0,0,0,0.04)",
                border:
                  gameMode === "ai"
                    ? `1px solid ${strategyColors.panelBorder}`
                    : "1px solid rgba(0,0,0,0.08)",
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8, color: "#111" }}>
                {gameMode === "ai" ? "AI Settings" : "Match Info"}
              </div>

              {gameMode === "ai" ? (
                <>
                  <label style={{ fontSize: 13, color: "#222" }}>
                    Difficulty: <b>{aiDifficulty.toFixed(1)}</b>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={aiDifficulty}
                    onChange={(e) => onDifficulty(parseFloat(e.target.value))}
                    style={{ width: "100%", margin: "8px 0 12px" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 13,
                      color: "#222",
                    }}
                  >
                    <div>
                      Strategy:{" "}
                      <b
                        style={{
                          color: getStrategyColors(aiStrategy).chipText,
                        }}
                      >
                        {aiStrategy}
                      </b>
                    </div>
                    <div>
                      Opponent: <b>{opponentLabel}</b>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 14, color: "#222" }}>
                  Opponent: <b>{opponentLabel}</b>
                </div>
              )}

              {/* Ball customisation */}
              <div style={{ marginTop: 16 }}>
                <div
                  style={{ fontWeight: 800, marginBottom: 8, color: "#111" }}
                >
                  Ball
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { id: "classic", label: "Classic" },
                      { id: "neon", label: "Neon" },
                      { id: "emoji", label: "Emoji" },
                      { id: "soccer", label: "Soccer" },
                      { id: "basketball", label: "Basketball" },
                    ].map((opt) => {
                      const active =
                        ballSkin.kind === (opt.id as BallSkin["kind"]);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (opt.id === "classic")
                              setBallSkin({
                                kind: "classic",
                                color: "#EADCB3",
                                outline: false,
                              });
                            else if (opt.id === "neon")
                              setBallSkin({ kind: "neon", color: "#74c0fc" });
                            else if (opt.id === "emoji")
                              setBallSkin({
                                kind: "emoji",
                                char: "🏓",
                                scale: 2.6,
                              });
                            else if (opt.id === "soccer")
                              setBallSkin({ kind: "soccer" });
                            else if (opt.id === "basketball")
                              setBallSkin({ kind: "basketball" });
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: active
                              ? "2px solid #111"
                              : "1px solid rgba(0,0,0,0.2)",
                            background: active
                              ? "rgba(0,0,0,0.06)"
                              : "rgba(0,0,0,0.03)",
                            fontWeight: 800,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {ballSkin.kind === "classic" && (
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <label style={{ fontSize: 12 }}>Color</label>
                      <input
                        type="color"
                        value={ballSkin.color}
                        onChange={(e) =>
                          setBallSkin({ ...ballSkin, color: e.target.value })
                        }
                      />
                      <label
                        style={{
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={ballSkin.outline}
                          onChange={(e) =>
                            setBallSkin({
                              ...ballSkin,
                              outline: e.target.checked,
                            })
                          }
                        />
                        Outline
                      </label>
                    </div>
                  )}

                  {ballSkin.kind === "neon" && (
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <label style={{ fontSize: 12 }}>Glow</label>
                      <input
                        type="color"
                        value={ballSkin.color}
                        onChange={(e) =>
                          setBallSkin({ ...ballSkin, color: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {ballSkin.kind === "emoji" && (
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <label style={{ fontSize: 12 }}>Emoji</label>
                      <input
                        style={{
                          border: "1px solid rgba(0,0,0,0.2)",
                          borderRadius: 8,
                          padding: "6px 10px",
                          width: 80,
                        }}
                        value={ballSkin.char}
                        onChange={(e) =>
                          setBallSkin({
                            ...ballSkin,
                            char: e.target.value.slice(0, 2),
                          })
                        }
                        placeholder="🏓"
                      />
                      <label style={{ fontSize: 12 }}>Size</label>
                      <input
                        type="range"
                        min={1.8}
                        max={3.6}
                        step={0.1}
                        value={ballSkin.scale}
                        onChange={(e) =>
                          setBallSkin({
                            ...ballSkin,
                            scale: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
