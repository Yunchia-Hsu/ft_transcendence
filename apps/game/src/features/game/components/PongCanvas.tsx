// apps/game/src/features/game/components/PongCanvas.tsx
import { PongAI } from "./AIOpponent.js";
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

type AIDecision = {
  direction: Direction;
  usePowerUp: boolean;
  confidence: number; // kept internally; not shown in UI
};

// Nice, soft colors per AI strategy
function getStrategyColors(mode: string) {
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
  // adaptive
  return {
    chipBg: "rgba(116,192,252,0.18)",
    chipBorder: "#74c0fc",
    chipText: "#74c0fc",
    panelBg:
      "linear-gradient(135deg, rgba(147,197,253,0.16), rgba(116,192,252,0.12))",
    panelBorder: "rgba(116,192,252,0.45)",
  };
}

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

  const aiOpponent = useRef<PongAI>(new PongAI(0.8));
  const stateRef = useRef<State>(createState());
  const aiDecision = useRef<AIDecision>({
    direction: 0,
    usePowerUp: false,
    confidence: 0,
  });

  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  const input = useRef<InputTuple>([0, 0]);
  const trail = useRef<Vec[]>([]);
  const particles = useRef<Particle[]>([]);
  const flash = useRef<number>(0);

  const [gameRunning, setGameRunning] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(0.8);
  const [gameMode, setGameMode] = useState<"ai" | "human">("human"); // derived from backend
  const [aiStrategy, setAiStrategy] = useState<string>("adaptive");
  const animationFrameId = useRef<number | null>(null);
  const didComplete = useRef(false);

  // Overlay states
  const [showPregame, setShowPregame] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  // pulse when AI strategy changes
  const [strategyPulse, setStrategyPulse] = useState(0);

  // adjust AI difficulty
  const handleDifficultyChange = (difficulty: number) => {
    setAiDifficulty(difficulty);
    aiOpponent.current.setDifficulty(difficulty);
  };

  // AI strategy change callback (only in AI mode)
  useEffect(() => {
    if (gameMode !== "ai") {
      setAiStrategy("adaptive");
      return;
    }
    aiOpponent.current.setOnStrategyChange((strategy: string) => {
      setAiStrategy(strategy);
      setStrategyPulse(1);
      setTimeout(() => setStrategyPulse(0), 500);
    });
  }, [gameMode]);

  // Detect game mode from backend
  useEffect(() => {
    if (!gameId) return;
    const fetchGameMode = async () => {
      try {
        const gameData = await GamesApi.get(gameId);
        const isAIGame = gameData.player2 === "bot";
        setGameMode(isAIGame ? "ai" : "human");
      } catch {
        setGameMode("human");
      }
    };
    fetchGameMode();
  }, [gameId]);

  /* ---------- load game meta (opponent) ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!gameId) return;
      try {
        const g = await GamesApi.get(gameId);
        const other =
          userId && g
            ? g.player1 === userId
              ? g.player2
              : g.player1
            : (g?.player2 ?? null);
        if (alive) setOpponentId(other ?? null);
      } catch (e) {
        console.error("Failed to load game meta:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [gameId, userId]);

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
      w: { idx: 0, dir: -1 },
      s: { idx: 0, dir: 1 },
      ArrowUp: { idx: 1, dir: -1 },
      ArrowDown: { idx: 1, dir: +1 },
    };

    const handle = (e: KeyboardEvent, pressed: boolean): void => {
      const m = keyMap[e.key];
      if (!m) return;

      if (e.key === "Space" && pressed) {
        console.log("Human player activates power-up");
        return;
      }

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

  /* ---------- AI input ---------- */
  const processAIInput = (currentTime: number): Direction => {
    aiDecision.current = aiOpponent.current.update(
      stateRef.current,
      currentTime
    );
    if (aiDecision.current.usePowerUp) {
      console.log("AI activates power-up");
    }
    return aiDecision.current.direction;
  };

  /* ---------- start a NEW game helper ---------- */
  const startNewGame = useCallback(async () => {
    if (!userId) return;
    const opponent =
      opponentId && opponentId !== "bot" ? opponentId : (opponentId ?? userId);
    try {
      const g = await GamesApi.start({ player1: userId, player2: opponent });

      // reset local sim before navigating
      stateRef.current = createState();
      didComplete.current = false;
      setCompleted(false);
      setGameRunning(false);
      setShowPregame(true);
      setCountdown(null);
      trail.current = [];
      particles.current = [];
      flash.current = 0;

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
        if (didComplete.current) break; // extra guard

        const leftInput = input.current[0];
        const rightInput: Direction =
          gameMode === "ai" ? processAIInput(now) : input.current[1];

        const ev = update(stateRef.current, [leftInput, rightInput]);

        trail.current.push({
          x: stateRef.current.ball.x,
          y: stateRef.current.ball.y,
        });
        if (trail.current.length > 14) trail.current.shift();

        if (ev.paddleHit !== null) {
          spawnHitParticles(
            particles.current,
            stateRef.current.ball.x,
            stateRef.current.ball.y,
            ev.paddleHit
          );
        }

        if (ev.goal !== null) {
          flash.current = 1;
          if (gameMode === "ai") {
            aiOpponent.current.analyzeGameState(stateRef.current);
          }
        }

        // win: exact target to avoid off-by-one UI vs server
        const [a, b] = stateRef.current.score; // live state
        if (!didComplete.current && (a === WIN_SCORE || b === WIN_SCORE)) {
          didComplete.current = true;
          setGameRunning(false);
          setCompleted(true);

          const score = `${a}-${b}`;
          // If right/player2 wins, use opponentId (may be "bot"). If left wins, use userId.
          const winnerId =
            a > b ? (userId ?? "player1") : (opponentId ?? "player2");

          // render final frame, then stop RAF immediately
          render(
            ctx,
            stateRef.current,
            trail.current,
            particles.current,
            flash.current,
            view.current.scale,
            gameMode === "ai"
          );
          if (animationFrameId.current !== null) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
          }

          if (gameId) {
            setCompleting(true);
            (async () => {
              const resp = await GamesApi.complete(gameId, { score, winnerId });
              if (!resp.ok && (resp as any).code !== "ALREADY_COMPLETED") {
                console.error("complete failed:", (resp as any).code);
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
        stateRef.current,
        trail.current,
        particles.current,
        flash.current,
        view.current.scale,
        gameMode === "ai"
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
  }, [gameRunning, gameId, userId, opponentId, gameMode]);

  /* ---------- Start / Countdown ---------- */
  const onPrimaryClick = () => {
    if (completed) {
      void startNewGame();
      return;
    }
    // Start countdown → then start
    if (countdownTimer.current) {
      window.clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setCountdown(3);
    setShowPregame(false);

    const id = window.setInterval(() => {
      setCountdown((prev) => {
        if (!prev || prev <= 1) {
          window.clearInterval(id);
          countdownTimer.current = null;
          // reset sim at the moment match begins
          stateRef.current = createState();
          didComplete.current = false;
          particles.current = [];
          trail.current = [];
          flash.current = 0;
          setCompleted(false);
          setGameRunning(true);
          return null;
        }
        return prev - 1;
      });
    }, 800);
    countdownTimer.current = id;
  };

  // Escape key to reopen pregame overlay if not running and not completed
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !gameRunning && !completed) {
        setShowPregame(true);
        setCountdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameRunning, completed]);

  const primaryLabel = completed
    ? completing
      ? t.game.mainMenu.savingResult
      : t.game.mainMenu.startNewGame
    : countdown !== null
      ? String(countdown)
      : t.game.buttons.start;

  const primaryDisabled = completing;

  const strategyColors = getStrategyColors(aiStrategy);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "grid",
        placeItems: "center",
        background: "#101418",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvas} />

      {/* --- IN-GAME: tiny AI MODE badge (only when vs AI & running) --- */}
      {gameRunning && gameMode === "ai" && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: `translateX(-50%) scale(${strategyPulse ? 1.05 : 1})`,
            transition: "transform 200ms ease",
            background: strategyColors.chipBg,
            color: strategyColors.chipText,
            border: `1px solid ${strategyColors.chipBorder}`,
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.4,
            zIndex: 5,
          }}
          title="AI strategy adapts during the match"
        >
          AI: {aiStrategy}
        </div>
      )}

      {/* --- PRE-GAME OVERLAY (cheerful gradient + info) --- */}
      {(showPregame || countdown !== null) && !completed && (
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
                  <span
                    style={{ fontSize: 28, fontWeight: 900, color: "#111" }}
                  >
                    Pong
                  </span>
                  {/* Mode chip with colored BG */}
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

                <button
                  onClick={onPrimaryClick}
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* Left: Controls */}
                <div
                  style={{
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontWeight: 800, marginBottom: 8, color: "#111" }}
                  >
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

                {/* Right: AI settings / info, tinted by current AI mode */}
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
                  <div
                    style={{ fontWeight: 800, marginBottom: 8, color: "#111" }}
                  >
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
                        onChange={(e) =>
                          handleDifficultyChange(parseFloat(e.target.value))
                        }
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
                          Opponent: <b>{opponentId ?? "bot"}</b>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, color: "#222" }}>
                      Opponent:{" "}
                      <b>
                        {opponentId && opponentId !== userId
                          ? opponentId
                          : "You"}
                      </b>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- POST-GAME OVERLAY --- */}
      {completed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "min(92vw, 640px)",
              borderRadius: 16,
              background: "rgba(16,16,16,0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 24,
              backdropFilter: "blur(6px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              Match Over
            </div>
            <div style={{ opacity: 0.9, marginBottom: 14 }}>
              Final Score:{" "}
              <b>
                {stateRef.current.score[0]} - {stateRef.current.score[1]}
              </b>
            </div>
            <button
              onClick={onPrimaryClick}
              disabled={primaryDisabled}
              style={{
                background: "#10B981",
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
              {completing
                ? t.game.mainMenu.savingResult
                : t.game.mainMenu.startNewGame}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------ effects & rendering helpers ------------ */

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
  scale: number,
  isRightAI: boolean
): void {
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
  for (let i = 0; i < trail.length; i += 1) {
    const t = i / trail.length;
    ctx.fillStyle = rgbaHex(COLORS.accent2, t * 0.6);
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

  // LEFT (human)
  ctx.fillStyle = COLORS.text;
  const leftX = 18;
  const leftY = s.paddles[0] * h - h * 0.1;
  const leftW = 12;
  const leftH = h * 0.2;
  roundRect(ctx, leftX, leftY, leftW, leftH, 6);
  ctx.fill();

  // RIGHT (may be AI)
  ctx.fillStyle = COLORS.text;
  const rightX = w - 30;
  const rightY = s.paddles[1] * h - h * 0.1;
  const rightW = 12;
  const rightH = h * 0.2;
  roundRect(ctx, rightX, rightY, rightW, rightH, 6);
  ctx.fill();

  // AI marker for right paddle (only when vs AI)
  if (isRightAI) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(16,185,129,0.95)"; // emerald
    ctx.setLineDash([6, 4]);
    ctx.shadowColor = "rgba(16,185,129,0.6)";
    ctx.shadowBlur = 14;
    roundRect(ctx, rightX - 4, rightY - 4, rightW + 8, rightH + 8, 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // tiny "AI" badge near paddle
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
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(s.ball.x * w, s.ball.y * h, 7, 0, Math.PI * 2);
  ctx.fill();

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
