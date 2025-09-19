export interface Vec {
  x: number;
  y: number;
}

export interface State {
  ball: Vec;
  vel: Vec; // units per second in 0..1 space
  paddles: [number, number]; // centers, 0..1
  score: [number, number];
}

export type Direction = -1 | 0 | 1;
export type InputTuple = [Direction, Direction];

export interface TickEvent {
  paddleHit: 0 | 1 | null;
  goal: 0 | 1 | null;
}

const BASE_SPEED = 0.4; // base units/sec for ball & paddle
const PADDLE_H = 0.2; // fraction of height
export const STEP = 1000 / 60; // ms per physics tick

export function createState(): State {
  return {
    ball: { x: 0.5, y: 0.5 },
    vel: { x: BASE_SPEED, y: BASE_SPEED },
    paddles: [0.4, 0.4],
    score: [0, 0],
  };
}

/**
 * Advance one fixed‐timestep tick, scaling all movement by speedFactor.
 */
export function update(
  s: State,
  input: InputTuple,
  speedFactor = 1
): TickEvent {
  // 1) move paddles
  const paddleSpeed = BASE_SPEED * 2.0 * (STEP / 1000) * speedFactor; // 2倍paddle速度
  
  s.paddles[0] = clamp01(s.paddles[0] + input[0] * paddleSpeed);
  s.paddles[1] = clamp01(s.paddles[1] + input[1] * paddleSpeed);
  // 2) move ball
  s.ball.x += s.vel.x * (STEP / 1000) * speedFactor;
  s.ball.y += s.vel.y * (STEP / 1000) * speedFactor;

  let paddleHit: 0 | 1 | null = null;
  let goal: 0 | 1 | null = null;

  // 3) bounce off top/bottom
  if (s.ball.y < 0) {
    s.ball.y = 0;        // 位置修正
    s.vel.y *= -1;       // 速度鏡射
  }
  if (s.ball.y > 1) {
    s.ball.y = 1;        // 位置修正（你少了這行）
    s.vel.y *= -1;       // 速度鏡射
  }

  // 4) paddle collisions
  if (s.ball.x < 0.03 && hit(s, 0)) {
    s.ball.x = 0.03;     // 建議和門檻一致
    s.vel.x *= -1;
    const off = (s.ball.y - s.paddles[0]) / (PADDLE_H / 2);
    s.vel.y = clampFloat(
      s.vel.y + off * 0.25 * BASE_SPEED,
      -BASE_SPEED * 1.5,
      BASE_SPEED * 1.5
    );
    paddleHit = 0;
  }
  if (s.ball.x > 0.97 && hit(s, 1)) {
    s.ball.x = 0.97;
    s.vel.x *= -1;
    const off = (s.ball.y - s.paddles[1]) / (PADDLE_H / 2);
    s.vel.y = clampFloat(
      s.vel.y + off * 0.25 * BASE_SPEED,
      -BASE_SPEED * 1.5,
      BASE_SPEED * 1.5
    );
    paddleHit = 1;
  }

  // 5) goals
  if (s.ball.x < 0) {
    s.score[1] += 1;
    resetBall(s, -1);
    goal = 1;
  } else if (s.ball.x > 1) {
    s.score[0] += 1;
    resetBall(s, +1);
    goal = 0;
  }

return { paddleHit, goal };
}

function hit(s: State, i: 0 | 1): boolean {
  const y = s.paddles[i];
  return s.ball.y > y - PADDLE_H / 2 && s.ball.y < y + PADDLE_H / 2;
}

function resetBall(s: State, dir: 1 | -1): void {
  s.ball = { x: 0.5, y: 0.5 };
  s.vel = {
    x: dir * BASE_SPEED,
    y: (Math.random() > 0.5 ? 1 : -1) * BASE_SPEED,
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampFloat = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));