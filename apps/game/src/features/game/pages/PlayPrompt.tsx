import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { GamesApi } from "@/shared/api";

type StartError = { message?: string };

const HAS_AI = false;

export default function PlayPrompt() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    if (!userId) return;
    setErr(null);
    setLoading(true);
    try {
      const opponentId = HAS_AI ? "bot" : userId;
      const game = await GamesApi.start({
        player1: userId,
        player2: opponentId,
      });
      navigate(`/game/${game.game_id}`);
    } catch (e: unknown) {
      const safe = e as StartError;
      setErr(safe.message ?? "Failed to start the game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        relative min-h-[calc(100vh-6px)] w-full
        bg-gradient-to-br from-sky-100 via-fuchsia-100 to-amber-100
        dark:from-sky-200/60 dark:via-fuchsia-200/60 dark:to-amber-200/60
        flex items-center justify-center px-4
      "
    >
      {/* subtle decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-20 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      <div
        className="
          relative w-full max-w-xl
          rounded-2xl border border-white/60
          bg-white/70 backdrop-blur-md shadow-xl
        "
      >
        <div className="p-7 sm:p-9">
          <h1
            className="
              text-3xl sm:text-4xl text-center font-extrabold tracking-tight mb-3
              bg-clip-text text-transparent
              bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-600
            "
          >
            No one cares if you win.
          </h1>
          {err && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
              {err}
            </div>
          )}

          <div className="flex items-center justify-center">
            <button
              onClick={start}
              disabled={loading || !userId}
              className="
                inline-flex items-center justify-center px-6 py-3 rounded-xl
                bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500
                text-white font-semibold shadow-lg shadow-rose-300/40
                hover:translate-y-[-2px] hover:shadow-xl hover:shadow-amber-300/50
                active:translate-y-[0px]
                transition-all disabled:opacity-60
              "
              aria-disabled={loading || !userId}
            >
              {loading ? "Starting…" : "Start the game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
