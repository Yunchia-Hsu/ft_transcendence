// apps/game/src/features/pong/PongConstants.ts
export const BASE_W = 960;
export const BASE_H = 640;
export const WIN_SCORE = 11;

export const COLORS = {
  bg1: "#B380A2",
  bg2: "#6F7D90",
  accent: "#EADCB3",
  accent2: "#E4EFC7",
  text: "#E4EFC7",
} as const;

export function getStrategyColors(mode: string) {
  if (mode === "aggressive") {
    return {
      chipBg: "rgba(255,107,107,0.18)",
      chipBorder: "#ff6b6b",
      chipText: "#ff6b6b",
      panelBg:
        "linear-gradient(135deg, rgba(255,153,153,0.16), rgba(255,107,107,0.12))",
      panelBorder: "rgba(255,107,107,0.45)",
    };
  }
  if (mode === "defensive") {
    return {
      chipBg: "rgba(81,207,102,0.18)",
      chipBorder: "#51cf66",
      chipText: "#51cf66",
      panelBg:
        "linear-gradient(135deg, rgba(110,231,183,0.16), rgba(81,207,102,0.12))",
      panelBorder: "rgba(81,207,102,0.45)",
    };
  }
  return {
    chipBg: "rgba(116,192,252,0.18)",
    chipBorder: "#74c0fc",
    chipText: "#74c0fc",
    panelBg:
      "linear-gradient(135deg, rgba(147,197,253,0.16), rgba(116,192,252,0.12))",
    panelBorder: "rgba(116,192,252,0.45)",
  };
}
