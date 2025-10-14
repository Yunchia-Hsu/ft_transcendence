import { useMemo, useEffect, useState } from "react";
import type {
  BracketResponse,
  TournamentDetail as TDetail,
} from "@/shared/api/types";
import { Link } from "react-router-dom";
import { useLang } from "@/localization";
import { GamesApi } from "@/shared/api/games";

type Props = {
  detail: TDetail;
  bracket: BracketResponse;
  currentUserId?: string | null;
  userName?: string | null;
};

type GameScore = {
  score: string;
  status: string;
};

export function TournamentDashboard({
  detail,
  bracket,
  currentUserId,
  userName,
}: Props) {
  const { t } = useLang();
  const [gameScores, setGameScores] = useState<Record<string, GameScore>>({});

  // ✅ Fetch backend game scores & statuses
  useEffect(() => {
    const fetchScores = async () => {
      const ids = bracket.matches.map((m) => m.gameId).filter(Boolean);
      if (ids.length === 0) return;

      const newScores: Record<string, GameScore> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const g = await GamesApi.get(id!);
            if (g) newScores[id!] = { score: g.score, status: g.status };
          } catch (e) {
            console.warn("Failed to load game", id, e);
          }
        })
      );
      setGameScores(newScores);
    };
    void fetchScores();
  }, [bracket]);

  const stats = useMemo(() => {
    const all = bracket.matches;
    const total = all.length;
    const completed = all.filter((m) => !!m.winnerUserId).length;
    const pending = total - completed;

    const nextMatch = currentUserId
      ? all.find(
          (m) =>
            !m.winnerUserId &&
            (m.p1.userId === currentUserId || m.p2.userId === currentUserId)
        )
      : undefined;

    const pendingList = all
      .filter((m) => !m.winnerUserId)
      .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex);

    const finishedList = all
      .filter((m) => !!m.winnerUserId)
      .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex);

    return {
      total,
      completed,
      pending,
      progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      nextMatch,
      pendingList,
      finishedList,
    };
  }, [bracket, currentUserId]);

  const roundTitle = (r: number) => `${t.tournamentsPage.bracket.round} ${r}`;
  const matchTitle = (m: BracketResponse["matches"][number]) =>
    `${t.tournamentsPage.bracket.match}${m.matchIndex + 1}`;

  const buildGameHref = (m: BracketResponse["matches"][number]) => {
    if (!m.gameId) return null;
    const status = gameScores[m.gameId]?.status;
    if (status === "Completed" || status === "Terminated") return null;

    const isP1 = currentUserId && m.p1.userId === currentUserId;
    const isP2 = currentUserId && m.p2.userId === currentUserId;
    const oppNick = isP1 ? m.p2.nickname : isP2 ? m.p1.nickname : "";
    const qs = new URLSearchParams({ f: "tournaments" });
    if (oppNick) qs.set("oppNick", oppNick);
    return `/game/${m.gameId}?${qs.toString()}`;
  };

  const renderScore = (gameId?: string) =>
    gameId && gameScores[gameId]
      ? gameScores[gameId].score
      : (t.tournamentsPage.bracket.noScore ?? "—");

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex items-end justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">
          Here is your stat {userName ? `, ${userName}` : ""}.
        </h1>
        <div className="text-sm text-gray-500">
          {t.tournamentsPage.title ?? "Tournament"}:{" "}
          <span className="font-medium">{detail.name}</span>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4">
        <KpiCard label={t.tournamentsPage.size} value={String(detail.size)} />
        <KpiCard
          label={t.game.tournaments.rounds}
          value={String(detail.rounds)}
        />
        <KpiCard
          label={t.tournamentsPage.bracket.title}
          value={`${stats.completed}/${stats.total}`}
          sub={`${stats.progressPct}%`}
        />
        <KpiCard
          label={t.tournamentsPage.statusTitle ?? "Status"}
          value={detail.status}
        />
      </section>

      {/* Progress */}
      <section className="p-4 border rounded-lg bg-white">
        <h3 className="font-semibold mb-3">
          {t.tournamentsPage.bracket.title}
        </h3>
        <ProgressBar percent={stats.progressPct} />
        <div className="text-sm text-gray-600 mt-2">
          {t.tournamentsPage.completed ?? "Completed"}: {stats.completed} •{" "}
          {t.tournamentsPage.pending ?? "Pending"}: {stats.pending}
        </div>
      </section>

      {/* Next Match */}
      {currentUserId && (
        <section className="p-4 border rounded-lg bg-white">
          <h3 className="font-semibold mb-2">
            {t.tournamentsPage.nextMatch ?? "Your next match"}
          </h3>
          {!stats.nextMatch ? (
            <p className="text-gray-600">
              {t.tournamentsPage.noUpcomingMatch ?? "No upcoming match."}
            </p>
          ) : (
            <NextMatchCard
              m={stats.nextMatch}
              currentUserId={currentUserId}
              title={matchTitle(stats.nextMatch)}
              gameHref={buildGameHref(stats.nextMatch)}
              score={renderScore(stats.nextMatch.gameId)}
              status={
                stats.nextMatch.gameId
                  ? gameScores[stats.nextMatch.gameId]?.status
                  : undefined
              }
            />
          )}
        </section>
      )}

      {/* Waiting For Players */}
      <section className="p-4 border rounded-lg bg-white">
        <h3 className="font-semibold mb-2">
          {t.tournamentsPage.bracket.waitingForPlayers}
        </h3>
        {stats.pendingList.length === 0 ? (
          <p className="text-gray-600">{t.tournamentsPage.none ?? "None"}</p>
        ) : (
          <ul className="space-y-2">
            {stats.pendingList.map((m) => {
              const status = m.gameId
                ? gameScores[m.gameId]?.status
                : undefined;
              const href = buildGameHref(m);

              const isCompleted =
                status === "Completed" || status === "Terminated";

              return (
                <li
                  key={`${m.round}-${m.matchIndex}`}
                  className="border rounded p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      {roundTitle(m.round)} • {matchTitle(m)}
                    </div>
                    <div className="font-medium">
                      {m.p1.nickname ?? "—"}{" "}
                      <span className="text-gray-400">vs</span>{" "}
                      {m.p2.nickname ?? "—"}{" "}
                      <span className="ml-1 text-xs text-gray-500">
                        ({renderScore(m.gameId)})
                      </span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="text-xs text-emerald-600 font-medium">
                      {status === "Terminated"
                        ? "Game terminated"
                        : "Game completed"}
                    </span>
                  ) : href ? (
                    <Link
                      to={href}
                      className="px-2 py-1 text-xs bg-indigo-50 rounded border border-indigo-100 hover:bg-indigo-100"
                    >
                      {t.tournamentsPage.bracket.openGame}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">No game yet</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Completed Matches */}
      <section className="p-4 border rounded-lg bg-white">
        <h3 className="font-semibold mb-2">
          {t.tournamentsPage.completedMatches ?? "Completed matches"}
        </h3>
        {stats.finishedList.length === 0 ? (
          <p className="text-gray-600">{t.tournamentsPage.none ?? "None"}</p>
        ) : (
          <ul className="space-y-2">
            {stats.finishedList.map((m) => (
              <li
                key={`${m.round}-${m.matchIndex}`}
                className="border rounded p-3"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {roundTitle(m.round)} • {matchTitle(m)}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {m.p1.nickname ?? "—"}{" "}
                    <span className="text-gray-400">vs</span>{" "}
                    {m.p2.nickname ?? "—"}{" "}
                    <span className="ml-1 text-xs text-gray-500">
                      ({renderScore(m.gameId)})
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wide text-emerald-700">
                    {t.tournamentsPage.bracket.winner}:{" "}
                    <span className="font-semibold">
                      {m.winnerUserId === m.p1.userId
                        ? (m.p1.nickname ?? m.p1.userId)
                        : (m.p2.nickname ?? m.p2.userId)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* --- Helpers --- */

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full h-2 bg-gray-200 rounded">
      <div className="h-2 bg-indigo-500 rounded" style={{ width: `${p}%` }} />
    </div>
  );
}

function NextMatchCard({
  m,
  currentUserId,
  title,
  gameHref,
  score,
  status,
}: {
  m: BracketResponse["matches"][number];
  currentUserId: string;
  title: string;
  gameHref: string | null;
  score: string;
  status?: string;
}) {
  const youAreP1 = m.p1.userId === currentUserId;
  const opp = youAreP1 ? m.p2 : m.p1;
  const you = youAreP1 ? m.p1 : m.p2;
  const isCompleted = status === "Completed" || status === "Terminated";

  return (
    <div className="mt-3 border rounded p-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500">{title}</div>
        <div className="font-medium">
          <span className="text-emerald-700">You</span>{" "}
          <span className="text-gray-400">vs</span> {opp.nickname || "—"}{" "}
          <span className="ml-1 text-xs text-gray-500">({score})</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          ({you.nickname ?? you.userId})
        </div>
      </div>

      {isCompleted ? (
        <span className="text-xs text-emerald-600 font-medium">
          {status === "Terminated" ? "Game terminated" : "Game completed"}
        </span>
      ) : gameHref ? (
        <Link
          to={gameHref}
          className="px-2 py-1 text-xs bg-indigo-50 rounded border border-indigo-100 hover:bg-indigo-100"
        >
          Open Game
        </Link>
      ) : (
        <span className="text-xs text-gray-400">No game yet</span>
      )}
    </div>
  );
}
