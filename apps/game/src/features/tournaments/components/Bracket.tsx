import { useMemo } from "react";
import type { BracketMatch } from "@/shared/api/types";
import { Link } from "react-router-dom";
import { useLang } from "@/localization";

type Props = {
  rounds: number;
  matches: BracketMatch[];
  onReport: (round: number, matchIndex: number, winnerUserId: string) => void;
  currentUserId?: string | null;
  disabled?: boolean;
  showRematch?: boolean;
};

export function Bracket({
  rounds,
  matches,
  onReport, // still passed for compatibility
  currentUserId,
  disabled,
}: Props) {
  const { t } = useLang();

  const cols = useMemo(() => {
    const bucket: Record<number, BracketMatch[]> = {};
    for (const m of matches) {
      (bucket[m.round] ??= []).push(m);
    }
    for (let r = 1; r <= rounds; r++) {
      bucket[r] = (bucket[r] ?? []).sort((a, b) => a.matchIndex - b.matchIndex);
    }
    return bucket;
  }, [matches, rounds]);

  return (
    <div className="w-full overflow-auto">
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${rounds}, minmax(220px, 1fr))` }}
      >
        {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => (
          <div key={r} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600">
              {t.tournamentsPage.bracket.round} {r}
            </h3>
            {(cols[r] ?? []).map((m) => (
              <MatchCard
                key={`${m.round}-${m.matchIndex}`}
                m={m}
                currentUserId={currentUserId ?? null}
                disabled={disabled}
                t={t}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  m,
  currentUserId,
  disabled,
  t,
}: {
  m: BracketMatch;
  currentUserId: string | null;
  disabled?: boolean;
  t: any;
}) {
  const winner = m.winnerUserId;
  const p1Id = m.p1.userId;
  const p2Id = m.p2.userId;

  const p1Active = !!winner && winner === p1Id;
  const p2Active = !!winner && winner === p2Id;

  // Only allow opening the game if it exists AND there is no winner yet
  const canOpenGame = !!m.gameId && !winner;

  // Opponent nickname relative to current user (used by the game screen)
  const opponentNickname =
    currentUserId === p1Id
      ? m.p2.nickname || ""
      : currentUserId === p2Id
        ? m.p1.nickname || ""
        : "";

  // Build game href with tournament flow + optional oppNick
  const gameHref = canOpenGame
    ? `/game/${m.gameId}?f=tournaments${
        opponentNickname
          ? `&oppNick=${encodeURIComponent(opponentNickname)}`
          : ""
      }`
    : null;

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-2">
        {t.tournamentsPage.bracket.match}
        {m.matchIndex + 1}
      </div>

      <Row label={m.p1.nickname ?? "—"} active={p1Active} t={t} />
      <Row label={m.p2.nickname ?? "—"} active={p2Active} t={t} />

      {gameHref ? (
        <div className="mt-2">
          <Link
            to={gameHref}
            className="text-xs inline-block px-2 py-1 bg-indigo-50 rounded border border-indigo-100 hover:bg-indigo-100"
          >
            {t.tournamentsPage.bracket.openGame}
          </Link>
        </div>
      ) : winner ? (
        <div className="mt-2 text-[11px] uppercase tracking-wide text-emerald-700">
          {t.tournamentsPage.bracket.resultRecorded}
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-500">
          {t.tournamentsPage.bracket.waitingForPlayers}
        </div>
      )}
    </div>
  );
}

function Row({ label, active, t }: { label: string; active: boolean; t: any }) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-1 rounded mb-1 ${
        active
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      <span className="text-sm">{label}</span>
      {active && (
        <span className="text-[10px] uppercase font-semibold text-emerald-700">
          {t.tournamentsPage.bracket.winner}
        </span>
      )}
    </div>
  );
}
