import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { GamesApi } from "@/shared/api";
import { OnlineUsers } from "@/features/users/components/OnlineUsers";
import { useLang } from "@/localization";

type StartError = { message?: string };

type GameSummary = {
  game_id: string;
  player1: string;
  player2: string;
  score: string;
  status: string;
  winner_id: string | null;
  created_at?: string;
};

export default function PlayPrompt() {
  const { t } = useLang();
  const navigate = useNavigate();

  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const userProfile = useAuthStore((s) => s.userProfile);
  const fetchUserProfile = useAuthStore((s) => s.fetchUserProfile);

  const [loading, setLoading] = useState<"self" | "ai" | "friend" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // ✅ Load profile after refresh
  useEffect(() => {
    if (token && !userProfile) void fetchUserProfile();
  }, [token, userProfile, fetchUserProfile]);

  // ✅ Load and refresh games
  useEffect(() => {
    if (!userId) return;
    const fetchGames = async () => {
      try {
        const res = await GamesApi.list({ player: userId });
        setGames(res);
      } catch (e) {
        console.warn("Failed to fetch games", e);
      }
    };
    void fetchGames();
    const interval = setInterval(fetchGames, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const registeredName =
    userProfile?.displayname?.trim() || userProfile?.username?.trim() || null;
  const helloText = t?.common?.hello ?? "Hello";

  // 🧮 Compute statistics
  const { wins, losses, terminated, winRate } = useMemo(() => {
    let wins = 0,
      losses = 0,
      terminated = 0;
    for (const g of games) {
      if (g.status === "Completed") {
        g.winner_id === userId ? wins++ : losses++;
      } else if (g.status === "Terminated") terminated++;
    }
    const total = wins + losses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
    return { wins, losses, terminated, winRate };
  }, [games, userId]);

  // 🎯 Win rate color and ring style
  const winRateNum = Number(winRate);
  const winRateColor =
    winRateNum >= 60
      ? "text-emerald-600"
      : winRateNum >= 40
        ? "text-amber-600"
        : "text-rose-600";

  // Ring stroke color for the circle progress
  const ringStroke =
    winRateNum >= 60 ? "#10b981" : winRateNum >= 40 ? "#f59e0b" : "#ef4444";

  // 🎮 Start handlers
  const startSelf = async () => {
    if (!userId) return;
    setErr(null);
    setLoading("self");
    try {
      const game = await GamesApi.start({ player1: userId, player2: userId });
      navigate(`/game/${game.game_id}`);
    } catch (e) {
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
    } catch (e) {
      const safe = e as StartError;
      setErr(safe.message ?? "Failed to start the AI game");
    } finally {
      setLoading(null);
    }
  };
  const startFriend = () => {
    if (!userId) return;
    setErr(null);
    setLoading("friend");
    navigate("/friends");
    setLoading(null);
  };
  const toTournaments = () => navigate("/tournaments");

  return (
    <div
      className="
        relative min-h-[calc(100vh-6px)] w-full
        bg-gradient-to-br from-sky-100 via-fuchsia-100 to-amber-100
        flex flex-col items-center justify-center gap-6 px-4 py-6
      "
    >
      {registeredName && (
        <div className="w-full max-w-5xl px-2">
          <p
            className="
              text-center font-extrabold leading-tight
              text-3xl sm:text-5xl md:text-6xl lg:text-7xl
              tracking-tight bg-clip-text text-transparent
              bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400
              animate-pulse
            "
          >
            {helloText}, {registeredName}
          </p>
        </div>
      )}

      <div className="relative w-full max-w-3xl rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xl">
        <div className="p-7 sm:p-9">
          <h1 className="text-3xl sm:text-4xl text-center font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-600">
            {t.game.mainMenu.title}
          </h1>

          {err && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
              {err}
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={startSelf}
              disabled={!userId || !!loading}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500 text-white font-semibold shadow-lg transition-all disabled:opacity-60"
            >
              {loading === "self"
                ? t.game.mainMenu.starting
                : t.game.mainMenu.playWithYourself}
            </button>

            <button
              onClick={startFriend}
              disabled={!userId || !!loading}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/70 border border-sky-200 text-sky-700 font-semibold shadow hover:bg-sky-50 transition-all disabled:opacity-60"
            >
              {loading === "friend"
                ? t.game.mainMenu.starting
                : t.game.mainMenu.playWithFriend}
            </button>

            <button
              onClick={toTournaments}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/70 border border-amber-200 text-amber-700 font-semibold shadow hover:bg-amber-50 transition-all"
            >
              {t.game.mainMenu.tournaments}
            </button>

            <button
              onClick={startAI}
              disabled={!userId || !!loading}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/70 border border-emerald-200 text-emerald-700 font-semibold shadow hover:bg-emerald-50 transition-all disabled:opacity-60"
            >
              {loading === "ai"
                ? t.game.mainMenu.starting
                : t.game.mainMenu.playWithAI}
            </button>
          </div>

          {/* 📊 Dashboard */}
          {games.length > 0 && (
            <div className="mt-8">
              {/* Clickable header */}
              <div
                onClick={() => setShowDashboard((p) => !p)}
                className="cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 bg-sky-50/70 hover:bg-sky-100 border border-sky-200 rounded-xl py-2 px-4 transition"
              >
                <span>
                  {showDashboard ? "Hide Dashboard" : "View Dashboard"}
                </span>
                <span
                  className={`transition-transform ${
                    showDashboard ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ⌄
                </span>
              </div>

              {/* Collapsible content */}
              <div
                className={`transition-all overflow-hidden ${
                  showDashboard
                    ? "max-h-[1000px] opacity-100 mt-5"
                    : "max-h-0 opacity-0"
                } duration-500 ease-in-out`}
              >
                {/* 🧮 Stats */}
                <div className="text-center">
                  <h3 className="text-md font-semibold text-gray-800 mb-3">
                    Your Stats
                  </h3>

                  {/* Win rate ring */}
                  <div className="flex justify-center items-center mb-3">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full rotate-[-90deg]">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="36"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="36"
                          stroke={ringStroke}
                          strokeWidth="8"
                          strokeDasharray="226"
                          strokeDashoffset={226 - (226 * winRateNum) / 100}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xl font-bold ${winRateColor}`}>
                          {winRate}%
                        </span>
                        <span className="text-xs text-gray-500">Win Rate</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary numbers */}
                  <div className="flex justify-center flex-wrap gap-4 text-sm font-medium">
                    <span className="text-emerald-600">🏆 Wins: {wins}</span>
                    <span className="text-rose-600">💀 Losses: {losses}</span>
                    <span className="text-gray-500">
                      ⛔ Terminated: {terminated}
                    </span>
                  </div>
                </div>

                {/* 🎮 Recent games */}
                <div className="mt-6 border-t border-gray-200 pt-5">
                  <h2 className="text-lg font-semibold mb-3">
                    {t?.game?.dashboard?.recentGames || "Recent Games"}
                  </h2>
                  <ul className="divide-y divide-gray-100">
                    {games.slice(0, 5).map((g) => {
                      const isWinner = g.winner_id === userId;
                      return (
                        <li
                          key={g.game_id}
                          className="py-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-md px-2 transition"
                          onClick={() => navigate(`/game/${g.game_id}`)}
                        >
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">
                              {g.score || "—"}
                            </span>{" "}
                            <span className="text-gray-400">•</span>{" "}
                            <span>{g.status}</span>
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              isWinner
                                ? "text-emerald-600"
                                : g.status === "In Progress"
                                  ? "text-sky-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {g.status === "Completed"
                              ? isWinner
                                ? "🏆 You won!"
                                : "💀 You lost"
                              : g.status === "In Progress"
                                ? "🎯 In Progress"
                                : "⛔ " + g.status}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Online users */}
          <div className="mt-8">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  );
}
