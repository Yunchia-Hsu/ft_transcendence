import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { State, Vec } from "../engine/engine";
import { createState, update, STEP } from "../engine/engine";
import { useTranslations } from "@/localization";
import { GamesApi } from "@/shared/api";
import { useAuthStore } from "@/features/auth/store/auth.store";

const BASE_W = 960;
const BASE_H = 640;
const WIN_SCORE = 11;

const COLORS = {
  bg1: "#B380A2",
  bg2: "#6F7D90",
  accent: "#EADCB3",
  accent2: "#E4EFC7",
  text: "#E4EFC7",
} as const;

type Direction = -1 | 0 | 1;
type InputTuple = [Direction, Direction];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  light: boolean;
}

type ViewParams = { cssW: number; cssH: number; dpr: number; scale: number };

export default function PongCanvas() {
  const t = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const userId = useAuthStore((s) => s.userId);
  const navigate = useNavigate();

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const view = useRef<ViewParams>({
    cssW: BASE_W,
    cssH: BASE_H,
    dpr: 1,
    scale: 1,
  });

  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);

  const [state, setState] = useState<State>(createState);
  const input = useRef<InputTuple>([0, 0]);
  const trail = useRef<Vec[]>([]);
  const particles = useRef<Particle[]>([]);
  const flash = useRef<number>(0);

  const animationFrameId = useRef<number | null>(null);
  const didComplete = useRef(false);

  /* ---------- load game meta (opponent) ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!gameId) return;
      try {
        const g = await GamesApi.get(gameId);
        if (alive) setOpponentId(g.player2 ?? null);
      } catch (e) {
        console.error("Failed to load game meta:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [gameId]);

  /* ---------- responsive sizing ---------- */
  useEffect(() => {
    const onResize = (): void => {
      if (!canvas.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const cssScale = Math.min(vw / BASE_W, vh / BASE_H);
      const cssW = Math.round(BASE_W * cssScale);
      const cssH = Math.round(BASE_H * cssScale);

      canvas.current.style.width = `${cssW}px`;
      canvas.current.style.height = `${cssH}px`;
      canvas.current.width = Math.round(cssW * dpr);
      canvas.current.height = Math.round(cssH * dpr);

      view.current = { cssW, cssH, dpr, scale: dpr * cssScale };
    };

    onResize();
    window.addEventListener("resize", onResize);

    const mq = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
    const dprListener = () => onResize();
    if (mq.addEventListener) mq.addEventListener("change", dprListener);
    else mq.addListener(dprListener);

    return () => {
      window.removeEventListener("resize", onResize);
      if (mq.removeEventListener) mq.removeEventListener("change", dprListener);
      else mq.removeListener(dprListener);
    };
  }, []);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const keyMap: Record<string, { idx: 0 | 1; dir: Direction }> = {
      w: { idx: 0, dir: 1 },
      s: { idx: 0, dir: -1 },
      ArrowUp: { idx: 1, dir: 1 },
      ArrowDown: { idx: 1, dir: -1 },
    };
    const handle = (e: KeyboardEvent, pressed: boolean): void => {
      const m = keyMap[e.key];
      if (!m) return;
      input.current[m.idx] = pressed ? m.dir : 0;
    };
    const down = (e: KeyboardEvent) => handle(e, true);
    const up = (e: KeyboardEvent) => handle(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ---------- start a NEW game helper ---------- */
  const startNewGame = useCallback(async () => {
    if (!userId) return;
    const opponent =
      opponentId && opponentId !== "bot" ? opponentId : (opponentId ?? userId);
    try {
      const g = await GamesApi.start({ player1: userId, player2: opponent });
      // reset local sim before navigating
      setState(createState());
      didComplete.current = false;
      setCompleted(false);
      setGameRunning(false);
      navigate(`/game/${g.game_id}`);
    } catch (e) {
      console.error("Failed to start new game:", e);
    }
  }, [navigate, opponentId, userId]);

  /* ---------- main loop ---------- */
  useEffect(() => {
    if (!gameRunning) {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    const cnv = canvas.current;
    if (!cnv) return;
    const ctx = cnv.getContext("2d");
    if (!ctx) return;

    let acc = 0;
    let last = performance.now();

    const loop = (now: number): void => {
      if (didComplete.current) return; // hard stop after completion

      acc += now - last;
      last = now;

      while (acc >= STEP) {
        const ev = update(state, input.current);

        trail.current.push({ x: state.ball.x, y: state.ball.y });
        if (trail.current.length > 14) trail.current.shift();

        if (ev.paddleHit !== null) {
          spawnHitParticles(
            particles.current,
            state.ball.x,
            state.ball.y,
            ev.paddleHit
          );
        }
        if (ev.goal !== null) flash.current = 1;

        // win: exact target to avoid off-by-one UI vs server
        const [a, b] = state.score;
        if (!didComplete.current && (a === WIN_SCORE || b === WIN_SCORE)) {
          didComplete.current = true;
          setGameRunning(false);
          setCompleted(true);

          const score = `${a}-${b}`;
          const winnerId =
            a > b
              ? (userId ?? "player1")
              : opponentId && opponentId !== "bot"
                ? opponentId
                : (userId ?? "player2");

          // render final frame, then stop RAF immediately
          render(
            ctx,
            state,
            trail.current,
            particles.current,
            flash.current,
            view.current.scale
          );
          if (animationFrameId.current !== null) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
          }

          if (gameId) {
            setCompleting(true);
            (async () => {
              const resp = await GamesApi.complete(gameId, { score, winnerId });
              // ignore already-completed; log anything else unexpected
              if (!resp.ok && resp.code !== "ALREADY_COMPLETED") {
                console.error("complete failed:", resp.code);
              }
              setCompleting(false);
            })();
          }

          return; // don’t render/schedule next frame
        }

        stepParticles(particles.current, STEP / 1000);
        flash.current = Math.max(0, flash.current - 1.5 * (STEP / 1000));
        acc -= STEP;
      }

      render(
        ctx,
        state,
        trail.current,
        particles.current,
        flash.current,
        view.current.scale
      );
      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
    // NOTE: do not include `state` in deps; it’s mutated per tick.
  }, [gameRunning, gameId, userId, opponentId]);

  /* ---------- Start/Stop (or New Game) button ---------- */
  const onPrimaryClick = () => {
    if (!completed) {
      if (gameRunning) {
        setState(createState());
        didComplete.current = false;
      }
      setGameRunning((prev) => !prev);
    } else {
      void startNewGame();
    }
  };

  const primaryLabel = !completed
    ? gameRunning
      ? t.game.buttons.stop
      : t.game.buttons.start
    : completing
      ? "Saving result…"
      : "Start a new game";

  const primaryDisabled = completing;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "grid",
        placeItems: "center",
        background: "#101418",
      }}
    >
      <canvas ref={canvas} />
      <button
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        style={{
          position: "absolute",
          bottom: "20px",
          backgroundColor: completed ? "#10B981" : "#FF8C00",
          border: "none",
          padding: "10px 20px",
          color: "white",
          fontSize: "18px",
          cursor: primaryDisabled ? "not-allowed" : "pointer",
          borderRadius: "5px",
          fontWeight: "bold",
          opacity: primaryDisabled ? 0.6 : 1,
        }}
      >
        {primaryLabel}
      </button>
    </div>
  );
}

/* ---------------- effects & rendering ---------------- */

function spawnHitParticles(
  out: Particle[],
  x: number,
  y: number,
  side: 0 | 1
): void {
  const count = 16;
  const baseVx = side === 0 ? 0.8 : -0.8;
  for (let i = 0; i < count; i += 1) {
    const ang = ((Math.random() - 0.5) * Math.PI) / 2;
    const speed = 0.2 + Math.random() * 0.5;
    const vx = baseVx * speed + Math.cos(ang) * 0.1;
    const vy = Math.sin(ang) * 0.6 * speed;
    out.push({
      x,
      y,
      vx,
      vy,
      life: 1,
      decay: 1.8 + Math.random() * 0.6,
      size: 3 + Math.random() * 2,
      light: Math.random() > 0.5,
    });
  }
}

function stepParticles(arr: Particle[], dt: number): void {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    const p = arr[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.3 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0) arr.splice(i, 1);
  }
}

function render(
  ctx: CanvasRenderingContext2D,
  s: State,
  trail: readonly Vec[],
  particles: readonly Particle[],
  flash: number,
  scale: number
): void {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const w = BASE_W,
    h = BASE_H;

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, COLORS.bg1);
  g.addColorStop(1, COLORS.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

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

  for (let i = 0; i < trail.length; i += 1) {
    const t = i / trail.length;
    ctx.fillStyle = rgbaHex(COLORS.accent2, t * 0.6);
    const pos = trail[i];
    ctx.beginPath();
    ctx.arc(pos.x * w, pos.y * h, 6 * t + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of particles) {
    const col = p.light ? COLORS.accent : COLORS.accent2;
    ctx.fillStyle = rgbaHex(col, Math.max(0, Math.min(1, p.life)));
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.text;
  roundRect(ctx, 18, s.paddles[0] * h - h * 0.1, 12, h * 0.2, 6);
  ctx.fill();
  roundRect(ctx, w - 30, s.paddles[1] * h - h * 0.1, 12, h * 0.2, 6);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(s.ball.x * w, s.ball.y * h, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.text;
  ctx.font = "600 48px system-ui, ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(s.score[0]), w / 2 - 80, 64);
  ctx.fillText(String(s.score[1]), w / 2 + 80, 64);

  if (flash > 0) {
    ctx.fillStyle = rgbaHex(COLORS.accent, flash * 0.35);
    ctx.fillRect(0, 0, w, h);
  }
}

function roundRect(
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

function rgbaHex(hex: string, alpha: number): string {
  const v = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}
