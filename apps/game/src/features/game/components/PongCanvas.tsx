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
const MAIN_MENU_PATH = "/game"; // change if your main menu route differs

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
  confidence: number;
};

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
  const [terminated, setTerminated] = useState(false);
  const [completing, setCompleting] = useState(false);

  const input = useRef<InputTuple>([0, 0]);
  const trail = useRef<Vec[]>([]);
  const particles = useRef<Particle[]>([]);
  const flash = useRef<number>(0);

  const [gameRunning, setGameRunning] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(0.8);
  const [gameMode, setGameMode] = useState<"ai" | "human">("human");
  const [aiStrategy, setAiStrategy] = useState<string>("adaptive");
  const animationFrameId = useRef<number | null>(null);
  const didComplete = useRef(false);

  // overlays
  const [showPregame, setShowPregame] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  // pulse when AI strategy changes
  const [strategyPulse, setStrategyPulse] = useState(0);

  // CONFIRM TERMINATE
  const [showConfirmTerminate, setShowConfirmTerminate] = useState(false);
  const [pausedForConfirm, setPausedForConfirm] = useState(false); // ← NEW

  const handleDifficultyChange = (difficulty: number) => {
    setAiDifficulty(difficulty);
    aiOpponent.current.setDifficulty(difficulty);
  };

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
      if (e.key === "Space" && pressed) return; // power-up (reserved)
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

  const startNewGame = useCallback(async () => {
    if (!userId) return;
    const opponent =
      opponentId && opponentId !== "bot" ? opponentId : (opponentId ?? userId);
    try {
      const g = await GamesApi.start({ player1: userId, player2: opponent });

      stateRef.current = createState();
      didComplete.current = false;
      setCompleted(false);
      setTerminated(false);
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

  // Pause when confirm opens; resume if cancelled
  useEffect(() => {
    if (showConfirmTerminate) {
      if (gameRunning) {
        setPausedForConfirm(true);
        setGameRunning(false); // pauses RAF; stateRef preserved
      }
    } else {
      if (pausedForConfirm && !terminated && !completed) {
        setGameRunning(true); // resume from exact frame
      }
      setPausedForConfirm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfirmTerminate]);

  // Confirm dialog keyboard handling
  useEffect(() => {
    if (!showConfirmTerminate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirmTerminate(false); // will resume via effect
      }
      if (e.key === "Enter") {
        setPausedForConfirm(false); // prevent resume-on-close
        setShowConfirmTerminate(false);
        void onTerminateClick();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirmTerminate]);

  const onTerminateClick = async () => {
    if (!gameId) return;
    // hard stop
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setGameRunning(false);
    didComplete.current = true;

    const [a, b] = stateRef.current.score;
    const score = `${a}-${b}`;

    try {
      setCompleting(true);
      const resp = await GamesApi.terminate(gameId, { score });
      if (
        !resp.ok &&
        resp.code !== "ALREADY_TERMINATED" &&
        resp.code !== "ALREADY_COMPLETED"
      ) {
        console.error("terminate failed:", resp.code);
      }
      setTerminated(true);
    } catch (e) {
      console.error("terminate error:", e);
      setTerminated(true);
    } finally {
      setCompleting(false);
    }
  };

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
      if (didComplete.current) return;

      acc += now - last;
      last = now;

      while (acc >= STEP) {
        if (didComplete.current) break;

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
          if (gameMode === "ai")
            aiOpponent.current.analyzeGameState(stateRef.current);
        }

        const [a, b] = stateRef.current.score;
        if (!didComplete.current && (a === WIN_SCORE || b === WIN_SCORE)) {
          didComplete.current = true;
          setGameRunning(false);
          setCompleted(true);

          const score = `${a}-${b}`;
          const winnerId =
            a > b ? (userId ?? "player1") : (opponentId ?? "player2");

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
              if (!resp.ok && resp.code !== "ALREADY_COMPLETED") {
                console.error("complete failed:", resp.code);
              }
              setCompleting(false);
            })();
          }
          return;
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

  const onPrimaryClick = () => {
    if (completed || terminated) {
      void startNewGame();
      return;
    }
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
          stateRef.current = createState();
          didComplete.current = false;
          particles.current = [];
          trail.current = [];
          flash.current = 0;
          setCompleted(false);
          setTerminated(false);
          setGameRunning(true);
          return null;
        }
        return prev - 1;
      });
    }, 800);
    countdownTimer.current = id;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !gameRunning && !completed && !terminated) {
        setShowPregame(true);
        setCountdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameRunning, completed, terminated]);

  const primaryLabel =
    completed || terminated
      ? completing
        ? t.game.mainMenu.savingResult
        : t.game.mainMenu.startNewGame
      : countdown !== null
        ? String(countdown)
        : t.game.buttons.start;

  const primaryDisabled = completing;
  const strategyColors = getStrategyColors(aiStrategy);

  const goToMenu = () => navigate(MAIN_MENU_PATH);

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

      {/* In-game: AI badge */}
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
            zIndex: 6,
          }}
          title="AI strategy adapts during the match"
        >
          AI: {aiStrategy}
        </div>
      )}

      {/* Back to Menu */}
      {gameRunning && (
        <button
          onClick={goToMenu}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 10,
            padding: "8px 12px",
            fontWeight: 700,
            cursor: "pointer",
            backdropFilter: "blur(6px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            zIndex: 6,
          }}
          title="Go back to the main menu"
        >
          ← Menu
        </button>
      )}

      {/* Terminate (opens confirm; game pauses automatically) */}
      {gameRunning && (
        <button
          onClick={() => setShowConfirmTerminate(true)}
          disabled={completing}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#EF4444",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontWeight: 800,
            cursor: completing ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            zIndex: 6,
          }}
          title="Stop this match early and save as Terminated"
        >
          Terminate Match
        </button>
      )}

      {/* PRE-GAME OVERLAY */}
      {(showPregame || countdown !== null) && !completed && !terminated && (
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

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={goToMenu}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(0,0,0,0.2)",
                      color: "#111",
                      padding: "10px 16px",
                      borderRadius: 10,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    ← Menu
                  </button>
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
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
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

      {/* POST-GAME / POST-TERMINATE OVERLAY */}
      {(completed || terminated) && (
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
              {terminated ? "Match Terminated" : "Match Over"}
            </div>
            <div style={{ opacity: 0.9, marginBottom: 14 }}>
              Final Score:{" "}
              <b>
                {stateRef.current.score[0]} - {stateRef.current.score[1]}
              </b>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={goToMenu}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ← Menu
              </button>
              <button
                onClick={onPrimaryClick}
                disabled={primaryDisabled}
                style={{
                  background: terminated ? "#EF4444" : "#10B981",
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
        </div>
      )}

      {/* CONFIRM TERMINATE MODAL (clicking backdrop resumes) */}
      {showConfirmTerminate && (
        <div
          onClick={() => setShowConfirmTerminate(false)} // resume via effect
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(92vw, 520px)",
              borderRadius: 16,
              background: "#121416",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 20,
              color: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div
              id="confirm-title"
              style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}
            >
              Terminate this match?
            </div>
            <div style={{ opacity: 0.9, marginBottom: 16, lineHeight: 1.5 }}>
              The current score{" "}
              <b>
                {stateRef.current.score[0]} - {stateRef.current.score[1]}
              </b>{" "}
              will be saved and the game will be marked as <b>Terminated</b>.
              This cannot be undone.
            </div>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowConfirmTerminate(false)} // resume via effect
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPausedForConfirm(false); // block resume
                  setShowConfirmTerminate(false);
                  void onTerminateClick();
                }}
                style={{
                  background: "#EF4444",
                  border: "none",
                  color: "#fff",
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Yes, terminate
              </button>
            </div>
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
