// apps/game/src/features/pong/PongCanvas.tsx
import { PongAI } from "./AIOpponent.js";
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type { State, Vec } from "../engine/engine";
import { createState, update, STEP } from "../engine/engine";
import { useTranslations } from "@/localization";
import { GamesApi } from "@/shared/api";
import { useAuthStore } from "@/features/auth/store/auth.store";

import { BASE_W, BASE_H, WIN_SCORE } from "./PongConstants";
import { loadBallSkin, saveBallSkin } from "./PongBallSkin";
import { spawnHitParticles, stepParticles } from "./PongEffects";
import { render } from "./PongRender";
import type {
  AIDecision,
  BallSkin,
  Direction,
  InputTuple,
  ViewParams,
} from "./PongTypes";
import { AIBadge, MenuButton, TerminateButton } from "./TopBars";
import { PregameOverlay } from "./PregameOverlay";
import { PostgameOverlay } from "./PostgameOverlay";
import { ConfirmTerminateModal } from "./ConfirmTerminateModal";
import { getStrategyColors } from "./PongConstants";

export default function PongCanvas() {
  const t = useTranslations();
  const { gameId } = useParams<{ gameId: string }>();
  const userId = useAuthStore((s) => s.userId);
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const isTournamentFlow = query.get("f") === "tournaments";
  const mainMenuPath = isTournamentFlow ? "/tournaments" : "/game";
  const oppNickFromQS = query.get("oppNick") || null;
  const p1NickFromQS = query.get("p1Nick") || null;
  const p2NickFromQS = query.get("p2Nick") || null;
  const [opponentNick, setOpponentNick] = useState<string | null>(null);

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
  const particles = useRef<any[]>([]);
  const flash = useRef<number>(0);

  const [gameRunning, setGameRunning] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(0.8);
  const [gameMode, setGameMode] = useState<"ai" | "human">("human");
  const [aiStrategy, setAiStrategy] = useState<string>("adaptive");
  const animationFrameId = useRef<number | null>(null);
  const didComplete = useRef(false);

  // Ball skin (persisted)
  const [ballSkin, setBallSkin] = useState<BallSkin>(() => loadBallSkin());
  useEffect(() => {
    saveBallSkin(ballSkin);
  }, [ballSkin]);

  // overlays
  const [showPregame, setShowPregame] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  // pulse when AI strategy changes
  const [strategyPulse, setStrategyPulse] = useState(0);

  // CONFIRM TERMINATE
  const [showConfirmTerminate, setShowConfirmTerminate] = useState(false);
  const [pausedForConfirm, setPausedForConfirm] = useState(false);

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
    let cancelled = false;
    (async () => {
      if (oppNickFromQS) {
        if (!cancelled) setOpponentNick(oppNickFromQS);
        return;
      }
      try {
        if (!gameId) return;
        const g = await GamesApi.get(gameId);
        if (g.player1 === userId) {
          if (!cancelled) setOpponentNick(p2NickFromQS || null);
          return;
        }
        if (g.player2 === userId) {
          if (!cancelled) setOpponentNick(p1NickFromQS || null);
          return;
        }
        if (!cancelled) setOpponentNick(p1NickFromQS || p2NickFromQS || null);
      } catch {
        setOpponentNick(p1NickFromQS || p2NickFromQS || null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, userId, oppNickFromQS, p1NickFromQS, p2NickFromQS, opponentId]);

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
      if (e.key === "Space" && pressed) return;
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
      ((trail.current = []), (particles.current = []), (flash.current = 0));

      navigate(`/game/${g.game_id}${isTournamentFlow ? "?f=tournaments" : ""}`);
    } catch (e) {
      console.error("Failed to start new game:", e);
    }
  }, [navigate, opponentId, userId, isTournamentFlow]);

  // Pause when confirm opens; resume if cancelled
  useEffect(() => {
    if (showConfirmTerminate) {
      if (gameRunning) {
        setPausedForConfirm(true);
        setGameRunning(false);
      }
    } else {
      if (pausedForConfirm && !terminated && !completed) setGameRunning(true);
      setPausedForConfirm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfirmTerminate]);

  // Confirm dialog keyboard handling
  useEffect(() => {
    if (!showConfirmTerminate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirmTerminate(false);
      if (e.key === "Enter") {
        setPausedForConfirm(false);
        setShowConfirmTerminate(false);
        void onTerminateClick();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirmTerminate]);

  const onTerminateClick = async () => {
    if (!gameId) return;
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

          render({
            ctx,
            s: stateRef.current,
            trail: trail.current,
            particles: particles.current,
            flash: flash.current,
            scale: view.current.scale,
            isRightAI: gameMode === "ai",
            skin: ballSkin,
          });

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

      render({
        ctx,
        s: stateRef.current,
        trail: trail.current,
        particles: particles.current,
        flash: flash.current,
        scale: view.current.scale,
        isRightAI: gameMode === "ai",
        skin: ballSkin,
      });

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [gameRunning, gameId, userId, opponentId, gameMode, ballSkin]);

  const onPrimaryClick = () => {
    if (completed || terminated) {
      if (isTournamentFlow) return; // do not open new games from tournament flow
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

  // Opponent label
  const opponentLabel =
    gameMode === "ai"
      ? oppNickFromQS || opponentNick || "bot"
      : isTournamentFlow && (oppNickFromQS || opponentNick)
        ? (oppNickFromQS || opponentNick)!
        : opponentNick && opponentNick !== userId
          ? opponentNick
          : "You";

  const goToMenu = useCallback(() => {
    navigate(mainMenuPath);
  }, [navigate, mainMenuPath]);

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

      {/* In-game top bars */}
      <AIBadge mode={gameMode} strategy={aiStrategy} pulse={strategyPulse} />
      <MenuButton visible={gameRunning} onClick={goToMenu} />
      <TerminateButton
        visible={gameRunning}
        onClick={() => setShowConfirmTerminate(true)}
        disabled={completing}
      />

      {/* PRE-GAME */}
      <PregameOverlay
        visible={
          (showPregame || countdown !== null) && !completed && !terminated
        }
        countdown={countdown}
        gameMode={gameMode}
        aiStrategy={aiStrategy}
        aiDifficulty={aiDifficulty}
        onDifficulty={handleDifficultyChange}
        onPrimary={onPrimaryClick}
        primaryDisabled={primaryDisabled}
        primaryLabel={primaryLabel}
        goToMenu={goToMenu}
        opponentLabel={opponentLabel}
        ballSkin={ballSkin}
        setBallSkin={setBallSkin}
      />

      {/* POST-GAME / TERMINATED */}
      <PostgameOverlay
        visible={completed || terminated}
        terminated={terminated}
        scoreA={stateRef.current.score[0]}
        scoreB={stateRef.current.score[1]}
        goToMenu={goToMenu}
        onPrimary={onPrimaryClick}
        primaryDisabled={primaryDisabled}
        primaryLabel={
          completing
            ? t.game.mainMenu.savingResult
            : t.game.mainMenu.startNewGame
        }
        showStartNew={!isTournamentFlow}
      />

      {/* CONFIRM TERMINATE */}
      <ConfirmTerminateModal
        visible={showConfirmTerminate}
        scoreA={stateRef.current.score[0]}
        scoreB={stateRef.current.score[1]}
        onCancel={() => setShowConfirmTerminate(false)}
        onConfirm={() => {
          setPausedForConfirm(false);
          setShowConfirmTerminate(false);
          void onTerminateClick();
        }}
      />
    </div>
  );
}
