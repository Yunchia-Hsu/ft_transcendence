import { useEffect, useRef, useState } from "react";
import { createState, update, STEP, State } from "./engine";

type Direction = -1 | 0 | 1; // shared alias
type InputTuple = [Direction, Direction];

export default function PongCanvas() {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [state] = useState<State>(createState);
  const input = useRef<InputTuple>([0, 0]);

  /* ----- helpers ------------------------------------------------------- */

  const render = (ctx: CanvasRenderingContext2D, s: State): void => {
    const { width: w, height: h } = ctx.canvas;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "white";
    // ball
    ctx.fillRect(s.ball.x * w - 5, s.ball.y * h - 5, 10, 10);
    // paddles
    ctx.fillRect(10, s.paddles[0] * h - h * 0.1, 10, h * 0.2);
    ctx.fillRect(w - 20, s.paddles[1] * h - h * 0.1, 10, h * 0.2);
    // score
    ctx.font = "32px monospace";
    ctx.fillText(String(s.score[0]), w / 2 - 40, 40);
    ctx.fillText(String(s.score[1]), w / 2 + 20, 40);
  };

  /* ----- keyboard listeners ------------------------------------------- */

  useEffect(() => {
    // map relevant keys to tuple indices and direction multipliers
    const keyMap: Record<string, { idx: 0 | 1; dir: Direction }> = {
      w: { idx: 0, dir: 1 },
      s: { idx: 0, dir: -1 },
      ArrowUp: { idx: 1, dir: 1 },
      ArrowDown: { idx: 1, dir: -1 },
    };

    const handle = (e: KeyboardEvent, pressed: boolean): void => {
      const mapping = keyMap[e.key];
      if (!mapping) return; // other keys ignored
      const { idx, dir } = mapping;
      input.current[idx] = pressed ? dir : 0;
    };

    const down = (e: KeyboardEvent): void => handle(e, true);
    const up = (e: KeyboardEvent): void => handle(e, false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ----- main loop ----------------------------------------------------- */

  useEffect(() => {
    if (!canvas.current) return; // safety for SSR / refs
    const ctx = canvas.current.getContext("2d");
    if (!ctx) return;

    let acc = 0;
    let last = performance.now();

    const loop = (now: number): void => {
      acc += now - last;
      last = now;

      while (acc >= STEP) {
        update(state, input.current);
        acc -= STEP;
      }
      render(ctx, state);
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, [state]);

  /* -------------------------------------------------------------------- */

  return (
    <canvas
      ref={canvas}
      width={800}
      height={600}
      style={{ background: "#000" }}
    />
  );
}
