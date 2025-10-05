// apps/game/src/features/pong/PongRender.ts
import { BASE_H, BASE_W, COLORS } from "./PongConstants";
import { roundRect, rgbaHex, drawBall } from "./PongDraw";
import type { RenderDeps } from "./PongTypes";

export function render({
  ctx,
  s,
  trail,
  particles,
  flash,
  scale,
  isRightAI,
  skin,
}: RenderDeps): void {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const w = BASE_W,
    h = BASE_H;

  // bg
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, COLORS.bg1);
  g.addColorStop(1, COLORS.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // center dashed divider
  ctx.save();
  ctx.fillStyle = COLORS.accent2;
  const segH = 16,
    gap = 16,
    midX = w / 2 - 2;
  for (let y = 0; y < h; y += segH + gap) {
    roundRect(ctx, midX, y, 4, segH, 2);
    ctx.fill();
  }
  ctx.restore();

  // ball trail
  const trailColor = skin.kind === "neon" ? COLORS.accent : COLORS.accent2;
  for (let i = 0; i < trail.length; i += 1) {
    const t = i / trail.length;
    ctx.fillStyle = rgbaHex(trailColor, t * 0.6);
    const pos = trail[i];
    ctx.beginPath();
    ctx.arc(pos.x * w, pos.y * h, 6 * t + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // particles
  for (const p of particles) {
    const col = p.light ? COLORS.accent : COLORS.accent2;
    ctx.fillStyle = rgbaHex(col, Math.max(0, Math.min(1, p.life)));
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // paddles
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;

  // LEFT
  ctx.fillStyle = COLORS.text;
  const leftX = 18;
  const leftY = s.paddles[0] * h - h * 0.1;
  const leftW = 12;
  const leftH = h * 0.2;
  roundRect(ctx, leftX, leftY, leftW, leftH, 6);
  ctx.fill();

  // RIGHT
  ctx.fillStyle = COLORS.text;
  const rightX = w - 30;
  const rightY = s.paddles[1] * h - h * 0.1;
  const rightW = 12;
  const rightH = h * 0.2;
  roundRect(ctx, rightX, rightY, rightW, rightH, 6);
  ctx.fill();

  // AI marker
  if (isRightAI) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(16,185,129,0.95)";
    ctx.setLineDash([6, 4]);
    ctx.shadowColor = "rgba(16,185,129,0.6)";
    ctx.shadowBlur = 14;
    roundRect(ctx, rightX - 4, rightY - 4, rightW + 8, rightH + 8, 8);
    ctx.stroke();
    ctx.setLineDash([]);

    const badgeW = 28,
      badgeH = 16;
    const bx = rightX - badgeW - 8;
    const by = rightY - badgeH - 6;
    ctx.fillStyle = "rgba(16,185,129,0.95)";
    roundRect(ctx, bx, by, badgeW, badgeH, 8);
    ctx.fill();

    ctx.fillStyle = "#071409";
    ctx.font = "bold 10px system-ui, ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AI", bx + badgeW / 2, by + badgeH / 2);
    ctx.restore();
  }

  ctx.restore();

  // ball
  const ballX = s.ball.x * w;
  const ballY = s.ball.y * h;
  const baseR = 7;
  drawBall(ctx, ballX, ballY, baseR, skin);

  // score
  ctx.fillStyle = COLORS.text;
  ctx.font = "600 48px system-ui, ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(s.score[0]), w / 2 - 80, 64);
  ctx.fillText(String(s.score[1]), w / 2 + 80, 64);

  // flash
  if (flash > 0) {
    ctx.fillStyle = rgbaHex(COLORS.accent, flash * 0.35);
    ctx.fillRect(0, 0, w, h);
  }
}
