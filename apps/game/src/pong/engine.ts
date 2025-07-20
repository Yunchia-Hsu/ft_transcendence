export interface Vec {
  x: number;
  y: number;
}
export interface State {
  ball: Vec;
  vel: Vec;
  paddles: [number, number]; // y positions, range 0–1
  score: [number, number];
}

const SPEED = 0.6; // units / second in virtual 0-1 space
export const STEP = 1000 / 60; // fixed-time step (ms)

export function createState(): State {
  return {
    ball: { x: 0.5, y: 0.5 },
    vel: { x: SPEED, y: SPEED },
    paddles: [0.4, 0.4],
    score: [0, 0],
  };
}

export function update(s: State, input: [-1 | 0 | 1, -1 | 0 | 1]) {
  // move paddles
  s.paddles[0] = clamp(s.paddles[0] + (input[0] * SPEED * STEP) / 1000);
  s.paddles[1] = clamp(s.paddles[1] + (input[1] * SPEED * STEP) / 1000);

  // move ball
  s.ball.x += (s.vel.x * STEP) / 1000;
  s.ball.y += (s.vel.y * STEP) / 1000;

  // wall bounce
  if (s.ball.y < 0 || s.ball.y > 1) s.vel.y *= -1;

  // paddle bounce
  if (s.ball.x < 0.03 && hitPaddle(s, 0)) s.vel.x *= -1;
  if (s.ball.x > 0.97 && hitPaddle(s, 1)) s.vel.x *= -1;

  // goals
  if (s.ball.x < 0) {
    s.score[1]++;
    resetBall(s, -1);
  }
  if (s.ball.x > 1) {
    s.score[0]++;
    resetBall(s, 1);
  }
}

function hitPaddle(s: State, i: 0 | 1) {
  const y = s.paddles[i];
  return s.ball.y > y - 0.1 && s.ball.y < y + 0.1; // paddle height 0.2
}
function resetBall(s: State, dir: 1 | -1) {
  s.ball = { x: 0.5, y: 0.5 };
  s.vel = { x: dir * SPEED, y: (Math.random() > 0.5 ? 1 : -1) * SPEED };
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
