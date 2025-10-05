// apps/game/src/features/pong/PongBallSkin.ts
import type { BallSkin } from "./PongTypes";

export function loadBallSkin(): BallSkin {
  try {
    const raw = localStorage.getItem("pong.ballSkin");
    if (!raw) throw new Error("no skin");
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.kind) throw new Error("bad");
    return parsed as BallSkin;
  } catch {
    return { kind: "classic", color: "#EADCB3", outline: false };
  }
}

export function saveBallSkin(skin: BallSkin) {
  localStorage.setItem("pong.ballSkin", JSON.stringify(skin));
}
