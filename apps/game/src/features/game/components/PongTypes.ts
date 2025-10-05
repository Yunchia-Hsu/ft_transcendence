// apps/game/src/features/pong/PongTypes.ts
import type { State, Vec } from "../engine/engine";

export type Direction = -1 | 0 | 1;
export type InputTuple = [Direction, Direction];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  light: boolean;
}

export type ViewParams = {
  cssW: number;
  cssH: number;
  dpr: number;
  scale: number;
};

export type AIDecision = {
  direction: Direction;
  usePowerUp: boolean;
  confidence: number;
};

// Ball customisation
export type BallSkin =
  | { kind: "classic"; color: string; outline: boolean }
  | { kind: "neon"; color: string }
  | { kind: "emoji"; char: string; scale: number }
  | { kind: "soccer" }
  | { kind: "basketball" };

export type GameMode = "ai" | "human";

export type RenderDeps = {
  ctx: CanvasRenderingContext2D;
  s: State;
  trail: readonly Vec[];
  particles: readonly Particle[];
  flash: number;
  scale: number;
  isRightAI: boolean;
  skin: BallSkin;
};
