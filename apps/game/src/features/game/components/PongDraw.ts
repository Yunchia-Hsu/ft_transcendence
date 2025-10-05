// apps/game/src/features/pong/PongDraw.ts
import { BASE_H, BASE_W, COLORS } from "./PongConstants";
import type { BallSkin } from "./PongTypes";

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function rgbaHex(hex: string, alpha: number): string {
  const v = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  skin: BallSkin
) {
  if (skin.kind === "emoji") {
    ctx.save();
    ctx.font = `${Math.round(r * (skin.scale ?? 2.6))}px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 6;
    ctx.fillText(skin.char || "🏓", x, y + 1);
    ctx.restore();
    return;
  }

  if (skin.kind === "neon") {
    ctx.save();
    ctx.shadowColor = skin.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = skin.color;
    ctx.beginPath();
    ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (skin.kind === "basketball") {
    ctx.save();
    ctx.fillStyle = "#D97706";
    ctx.beginPath();
    ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1F2937";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + 0.6, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r + 0.6, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - (r + 1), y);
    ctx.lineTo(x + (r + 1), y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (skin.kind === "soccer") {
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1F2937";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - (r + 1), y);
    ctx.lineTo(x + (r + 1), y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - (r + 1));
    ctx.lineTo(x, y + (r + 1));
    ctx.stroke();
    ctx.restore();
    return;
  }

  // classic
  ctx.save();
  const color = skin.kind === "classic" ? skin.color : COLORS.accent;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (skin.kind === "classic" && skin.outline) {
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}
