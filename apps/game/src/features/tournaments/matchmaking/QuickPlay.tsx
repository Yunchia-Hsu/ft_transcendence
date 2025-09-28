import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MatchmakingApi } from "@/shared/api/matchmaking";
import { useAuthStore } from "@/features/auth/store/auth.store";

type Phase = "idle" | "queueing" | "queued" | "error";

export function QuickPlay() {
  const userId = useAuthStore((s) => s.userId);
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string>("");

  const pollTimer = useRef<number | null>(null);
  const mounted = useRef(true);

  // ---- helpers ----
  const clearPoll = () => {
    if (pollTimer.current !== null) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const startPollingStatus = useCallback(
    (uid: string) => {
      clearPoll();
      // First immediate check
      MatchmakingApi.status(uid)
        .then((st) => {
          if (st.status === "matched") {
            navigate(`/game/${st.matchId}`);
            return;
          }
          if (mounted.current && phase !== "queued") {
            setPhase("queued");
            setMessage("Waiting for an opponent…");
          }
        })
        .catch(() => {
          if (mounted.current) {
            setPhase("error");
            setMessage("Failed to check status.");
          }
        });

      // Poll every 1.5s
      pollTimer.current = window.setInterval(async () => {
        try {
          const st = await MatchmakingApi.status(uid);
          if (st.status === "matched") {
            clearPoll();
            navigate(`/game/${st.matchId}`);
          }
        } catch {
          // ignore transient polling errors
        }
      }, 1500) as unknown as number;
    },
    [navigate, phase]
  );

  // On mount, try to resume: if already matched/queued
  useEffect(() => {
    mounted.current = true;
    if (userId) {
      MatchmakingApi.status(userId)
        .then((st) => {
          if (!mounted.current) return;
          if (st.status === "matched") {
            navigate(`/game/${st.matchId}`);
          } else if (st.status === "queued") {
            setPhase("queued");
            setMessage("Waiting for an opponent…");
            startPollingStatus(userId);
          }
        })
        .catch(() => {
          /* ignore */
        });
    }
    return () => {
      mounted.current = false;
      clearPoll();
    };
  }, [navigate, startPollingStatus, userId]);

  // ---- actions ----
  const onQuickPlay = async () => {
    if (!userId) return;
    setPhase("queueing");
    setMessage("Joining queue…");

    try {
      const res = await MatchmakingApi.enqueue(userId);
      // Matched immediately
      if ("status" in res && res.status === "matched") {
        navigate(`/game/${res.matchId}`);
        return;
      }
      // Already queued (idempotent)
      if ("status" in res && res.status === "queued") {
        setPhase("queued");
        setMessage("Waiting for an opponent…");
        startPollingStatus(userId);
        return;
      }
      // Conflict: already in a non-completed game
      if ("ok" in res && res.ok === false && res.code === "ALREADY_IN_GAME") {
        const st = await MatchmakingApi.status(userId);
        if (st.status === "matched") {
          navigate(`/game/${st.matchId}`);
          return;
        }
        // Fallback
        setPhase("queued");
        setMessage("You were already in a match. Checking…");
        startPollingStatus(userId);
        return;
      }

      // Fallback to queued
      setPhase("queued");
      setMessage("Waiting for an opponent…");
      startPollingStatus(userId);
    } catch (e) {
      setPhase("error");
      setMessage("Failed to enqueue.");
    }
  };

  const onCancel = async () => {
    if (!userId) return;
    try {
      await MatchmakingApi.dequeue(userId);
    } catch {
      // ignore; either way we'll reset UI
    } finally {
      clearPoll();
      setPhase("idle");
      setMessage("");
    }
  };

  // ---- UI ----
  const busy = phase === "queueing";
  const queued = phase === "queued";
  const error = phase === "error";

  return (
    <div className="max-w-md mx-auto mt-6 p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-2">Quick Play</h2>
      <p className="text-sm text-gray-600 mb-4">
        We’ll pair you with the next available player and jump right into a
        game.
      </p>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
          onClick={onQuickPlay}
          disabled={busy || queued}
        >
          {busy ? "Joining…" : queued ? "Searching…" : "Find Opponent"}
        </button>
        {queued && (
          <button
            className="px-4 py-2 rounded bg-gray-200"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        )}
      </div>

      {message && (
        <div className="mt-3 text-sm text-gray-700">
          {error ? <span className="text-red-600">{message}</span> : message}
        </div>
      )}
    </div>
  );
}
