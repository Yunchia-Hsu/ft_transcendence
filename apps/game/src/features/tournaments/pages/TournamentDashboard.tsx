import { useMemo } from "react";
import type {
  BracketResponse,
  TournamentDetail as TDetail,
} from "@/shared/api/types";
import { Link } from "react-router-dom";
import { useLang } from "@/localization";

type Props = {
  detail: TDetail; // from TournamentsApi.get(id)
  bracket: BracketResponse; // from TournamentsApi.bracket(id)
  currentUserId?: string | null; // logged-in user (for "Your next match")
  userName?: string | null; // <-- NEW: name to greet the user with
};

export function TournamentDashboard({
  detail,
  bracket,
  currentUserId,
  userName,
}: Props) {
  const { t } = useLang();

  const stats = useMemo(() => {
    const allMatches = bracket.matches;
    const total = allMatches.length;

    const completed = allMatches.filter((m) => !!m.winnerUserId).length;
    const pending = total - completed;

    const nextMatch = currentUserId
      ? allMatches
          .filter((m) => !m.winnerUserId)
          .find(
            (m) =>
              m.p1.userId === currentUserId || m.p2.userId === currentUserId
          )
      : undefined;

    const byRound: Record<number, { total: number; done: number }> = {};
    for (let r = 1; r <= bracket.rounds; r++)
      byRound[r] = { total: 0, done: 0 };
    for (const m of allMatches) {
      byRound[m.round] ??= { total: 0, done: 0 };
      byRound[m.round].total++;
      if (m.winnerUserId) byRound[m.round].done++;
    }

    const pendingList = allMatches
      .filter((m) => !m.winnerUserId)
      .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex);

    const finishedList = allMatches
      .filter((m) => !!m.winnerUserId)
      .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex);

    return {
      total,
      completed,
      pending,
      progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      byRound,
      nextMatch,
      pendingList,
      finishedList,
    };
  }, [bracket, currentUserId]);

  const roundTitle = (r: number) => `${t.tournamentsPage.bracket.round} ${r}`;
  const matchTitle = (m: BracketResponse["matches"][number]) =>
    `${t.tournamentsPage.bracket.match}${m.matchIndex + 1}`;

  const buildGameHref = (m: BracketResponse["matches"][number]) => {
    if (!m.gameId || m.winnerUserId) return null;

    const isP1 = currentUserId && m.p1.userId === currentUserId;
    const isP2 = currentUserId && m.p2.userId === currentUserId;

    const oppNick = isP1
      ? m.p2.nickname || ""
      : isP2
        ? m.p1.nickname || ""
        : "";

    const qs = new URLSearchParams({ f: "tournaments" });
    if (oppNick) qs.set("oppNick", oppNick);

    return `/game/${m.gameId}?${qs.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* ===== Title / Greeting ===== */}
      <section className="flex items-end justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">
          Here is your Dashboard{userName ? `, ${userName}` : ""}.
        </h1>
        <div className="text-sm text-gray-500">
          {t.tournamentsPage.title ?? "Tournament"}:{" "}
          <span className="font-medium">{detail.name}</span>
        </div>
      </section>

      {/* Top KPIs */}
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

      {/* Overall progress */}
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

      {/* Round progress */}
      <section className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
        {Array.from({ length: bracket.rounds }, (_, i) => i + 1).map((r) => {
          const br = stats.byRound[r];
          const pct = br.total > 0 ? Math.round((br.done / br.total) * 100) : 0;
          return (
            <div key={r} className="p-4 border rounded-lg bg-white">
              <div className="font-semibold mb-2">{roundTitle(r)}</div>
              <ProgressBar percent={pct} />
              <div className="text-xs text-gray-600 mt-2">
                {br.done}/{br.total}
              </div>
            </div>
          );
        })}
      </section>

      {/* Your next match */}
      {currentUserId && (
        <section className="p-4 border rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {t.tournamentsPage.nextMatch ?? "Your next match"}
            </h3>
          </div>

          {!stats.nextMatch ? (
            <p className="text-gray-600 mt-2">
              {t.tournamentsPage.noUpcomingMatch ??
                "No upcoming match found for you."}
            </p>
          ) : (
            <NextMatchCard
              m={stats.nextMatch}
              currentUserId={currentUserId}
              title={matchTitle(stats.nextMatch)}
              gameHref={buildGameHref(stats.nextMatch)}
            />
          )}
        </section>
      )}

      {/* Pending matches */}
      <section className="p-4 border rounded-lg bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {t.tournamentsPage.bracket.waitingForPlayers}
          </h3>
          <span className="text-sm text-gray-500">{stats.pending}</span>
        </div>
        {stats.pendingList.length === 0 ? (
          <p className="text-gray-600 mt-2">
            {t.tournamentsPage.none ?? "None"}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.pendingList.map((m) => {
              const href = buildGameHref(m);
              return (
                <li
                  key={`${m.round}-${m.matchIndex}`}
                  className="border rounded p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs text-gray-500">
                      {roundTitle(m.round)} • {matchTitle(m)}
                    </div>
                    <div className="font-medium">
                      {m.p1.nickname ?? "—"}{" "}
                      <span className="text-gray-400">vs</span>{" "}
                      {m.p2.nickname ?? "—"}
                    </div>
                  </div>
                  {href ? (
                    <Link
                      to={href}
                      className="px-2 py-1 text-xs bg-indigo-50 rounded border border-indigo-100 hover:bg-indigo-100"
                    >
                      {t.tournamentsPage.bracket.openGame}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t.tournamentsPage.bracket.noGameYet ?? "No game yet"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Finished matches */}
      <section className="p-4 border rounded-lg bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {t.tournamentsPage.completedMatches ?? "Completed matches"}
          </h3>
          <span className="text-sm text-gray-500">{stats.completed}</span>
        </div>
        {stats.finishedList.length === 0 ? (
          <p className="text-gray-600 mt-2">
            {t.tournamentsPage.none ?? "None"}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
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
                    {m.p2.nickname ?? "—"}
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

/* -------------------- Small UI bits -------------------- */

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
      {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
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
}: {
  m: BracketResponse["matches"][number];
  currentUserId: string;
  title: string;
  gameHref: string | null;
}) {
  const youAreP1 = m.p1.userId === currentUserId;
  const opp = youAreP1 ? m.p2 : m.p1;
  const you = youAreP1 ? m.p1 : m.p2;

  return (
    <div className="mt-3 border rounded p-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500">{title}</div>
        <div className="font-medium">
          <span className="text-emerald-700">You</span>{" "}
          <span className="text-gray-400">vs</span> {opp.nickname || "—"}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          ({you.nickname ?? you.userId})
        </div>
      </div>
      {gameHref ? (
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
