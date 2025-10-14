import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { GamesApi } from "@/shared/api";
import { OnlineUsers } from "@/features/users/components/OnlineUsers";
import { useLang } from "@/localization";

type StartError = { message?: string };

export default function PlayPrompt() {
  const { t } = useLang();
  const navigate = useNavigate();

  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const userProfile = useAuthStore((s) => s.userProfile);
  const fetchUserProfile = useAuthStore((s) => s.fetchUserProfile);

  // ensure profile is loaded after hard refresh
  useEffect(() => {
    if (token && !userProfile) void fetchUserProfile();
  }, [token, userProfile, fetchUserProfile]);

  // displayname → username → (no fallback)
  const registeredName =
    (userProfile?.displayname && userProfile.displayname.trim()) ||
    (userProfile?.username && userProfile.username.trim()) ||
    null;

  const helloText = t?.common?.hello ?? "Hello";

  const [loading, setLoading] = useState<"self" | "ai" | "friend" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const startSelf = async () => {
    if (!userId) return;
    setErr(null);
    setLoading("self");
    try {
      const game = await GamesApi.start({ player1: userId, player2: userId });
      navigate(`/game/${game.game_id}`);
    } catch (e: unknown) {
      const safe = e as StartError;
      setErr(safe.message ?? "Failed to start the game");
    } finally {
      setLoading(null);
    }
  };

  const startAI = async () => {
    if (!userId) return;
    setErr(null);
    setLoading("ai");
    try {
      const game = await GamesApi.start({ player1: userId, player2: "bot" });
      navigate(`/game/${game.game_id}`);
    } catch (e: unknown) {
      const safe = e as StartError;
      setErr(safe.message ?? "Failed to start the AI game");
    } finally {
      setLoading(null);
    }
  };

  // 🧑‍🤝‍🧑 Play with Friend
  const startFriend = async () => {
    if (!userId) return;
    setErr(null);
    setLoading("friend");
    try {
      // Option 1: Navigate to your Friends page to select who to play with
      navigate("/friends");

      // Option 2 (later): directly start a game if you already know friendId
      // const game = await GamesApi.start({ player1: userId, player2: friendId });
      // navigate(`/game/${game.game_id}`);
    } catch (e: unknown) {
      const safe = e as StartError;
      setErr(safe.message ?? "Failed to start friend game");
    } finally {
      setLoading(null);
    }
  };

  const toTournaments = () => navigate("/tournaments");

  return (
    <div
      className="
        relative min-h-[calc(100vh-6px)] w-full
        bg-gradient-to-br from-sky-100 via-fuchsia-100 to-amber-100
        dark:from-sky-200/60 dark:via-fuchsia-200/60 dark:to-amber-200/60
        flex flex-col items-center justify-center gap-6 px-4 py-6
      "
    >
      {/* 🔥 Neon greeting UNDER the popup */}
      {registeredName && (
        <div className="w-full max-w-5xl px-2">
          <p
            className="
              text-center font-extrabold leading-tight
              text-3xl sm:text-5xl md:text-6xl lg:text-7xl
              tracking-tight select-none
              bg-clip-text text-transparent
              bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400
              [text-shadow:0_0_8px_rgba(255,0,255,0.7),0_0_18px_rgba(0,255,255,0.6),0_0_28px_rgba(255,255,0,0.45)]
              drop-shadow-[0_0_12px_rgba(255,0,255,0.35)]
              animate-pulse
              px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4
            "
          >
            {helloText}, {registeredName}
          </p>
        </div>
      )}

      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-20 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      {/* Popup card */}
      <div
        className="
          relative w-full max-w-2xl
          rounded-2xl border border-white/60
          bg-white/70 backdrop-blur-md shadow-xl
        "
      >
        <div className="p-7 sm:p-9">
          {/* Title */}
          <h1
            className="
              text-3xl sm:text-4xl text-center font-extrabold tracking-tight mb-2
              bg-clip-text text-transparent
              bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-600
            "
          >
            {t.game.mainMenu.title}
          </h1>

          {err && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
              {err}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Play Yourself */}
            <button
              onClick={startSelf}
              disabled={!userId || !!loading}
              className="
                inline-flex items-center justify-center px-6 py-3 rounded-xl
                bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500
                text-white font-semibold shadow-lg shadow-rose-300/40
                hover:translate-y-[-2px] hover:shadow-xl hover:shadow-amber-300/50
                active:translate-y-[0px]
                transition-all disabled:opacity-60
              "
            >
              {loading === "self"
                ? t.game.mainMenu.starting
                : t.game.mainMenu.playWithYourself}
            </button>

            {/* Play with Friend */}
            <button
              onClick={startFriend}
              disabled={!userId || !!loading}
              className="
                inline-flex items-center justify-center px-6 py-3 rounded-xl
                bg-white/70 border border-sky-200
                text-sky-700 font-semibold shadow
                hover:bg-sky-50 hover:border-sky-300
                hover:translate-y-[-2px]
                active:translate-y-[0px]
                transition-all disabled:opacity-60
              "
              title="Start a game with a friend"
            >
              {loading === "friend"
                ? t.game.mainMenu.starting
                : t.game.mainMenu.playWithFriend}
            </button>

            {/* Tournaments */}
            <button
              onClick={toTournaments}
              className="
                inline-flex items-center justify-center px-6 py-3 rounded-xl
                bg-white/70 border border-amber-200
                text-amber-700 font-semibold shadow
                hover:bg-amber-50 hover:border-amber-300
                hover:translate-y-[-2px]
                active:translate-y-[0px]
                transition-all
              "
            >
              {t.game.mainMenu.tournaments}
            </button>

            {/* Play vs AI */}
            <button
              onClick={startAI}
              disabled={!userId || !!loading}
              className="
                inline-flex items-center justify-center px-6 py-3 rounded-xl
                bg-white/70 border border-emerald-200
                text-emerald-700 font-semibold shadow
                hover:bg-emerald-50 hover:border-emerald-300
                hover:translate-y-[-2px]
                active:translate-y-[0px]
                transition-all disabled:opacity-60
              "
            >
              {loading === "ai"
                ? t.game.mainMenu.starting
                : t.game.mainMenu.playWithAI}
            </button>
          </div>

          <div className="mt-6">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  );
}
