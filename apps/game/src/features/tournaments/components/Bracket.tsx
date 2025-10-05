// apps/game/src/features/tournaments/components/Bracket.tsx
import { useMemo } from "react";
import type { BracketMatch } from "@/shared/api/types";
import { Link } from "react-router-dom";
import { useLang } from "@/localization";

type Props = {
  rounds: number;
  matches: BracketMatch[];
  onReport: (round: number, matchIndex: number, winnerUserId: string) => void;
  /** Only a participant in the match may report (if provided). */
  currentUserId?: string | null;
  disabled?: boolean;
  /** Kept for compatibility; rematch UI is intentionally not rendered. */
  showRematch?: boolean;
};

export function Bracket({
  rounds,
  matches,
  onReport,
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
                onReport={onReport}
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
  onReport,
  currentUserId,
  disabled,
  t,
}: {
  m: BracketMatch;
  onReport: (round: number, matchIndex: number, winnerUserId: string) => void;
  currentUserId: string | null;
  disabled?: boolean;
  t: any; // Using any for simplicity
}) {
  const winner = m.winnerUserId;
  const p1Id = m.p1.userId;
  const p2Id = m.p2.userId;

  const userIsParticipant =
    !!currentUserId && (currentUserId === p1Id || currentUserId === p2Id);

  // Only when both players present, not already decided, not globally disabled, and (if provided) current user is a participant
  const canReport =
    !!p1Id &&
    !!p2Id &&
    !winner &&
    !disabled &&
    (currentUserId ? userIsParticipant : true);

  const p1Active = !!winner && winner === p1Id;
  const p2Active = !!winner && winner === p2Id;

  const reportP1 = () => {
    if (!p1Id) return;
    onReport(m.round, m.matchIndex, p1Id);
  };
  const reportP2 = () => {
    if (!p2Id) return;
    onReport(m.round, m.matchIndex, p2Id);
  };

  // Only allow opening the game if it exists AND there is no winner yet
  const canOpenGame = !!m.gameId && !winner;
  const gameHref = canOpenGame ? `/game/${m.gameId}?f=tournaments` : null;

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
      ) : null}

      {canReport ? (
        <div className="mt-3 flex gap-2">
          <button
            className="px-2 py-1 text-xs bg-emerald-600 text-white rounded disabled:opacity-60"
            onClick={reportP1}
            disabled={!p1Id}
            title="Report P1 as winner"
          >
            {t.tournamentsPage.bracket.p1Wins}
          </button>
          <button
            className="px-2 py-1 text-xs bg-emerald-600 text-white rounded disabled:opacity-60"
            onClick={reportP2}
            disabled={!p2Id}
            title="Report P2 as winner"
          >
            {t.tournamentsPage.bracket.p2Wins}
          </button>
        </div>
      ) : !winner ? (
        <div className="mt-2 text-xs text-gray-500">
          {t.tournamentsPage.bracket.waitingForPlayers}
        </div>
      ) : null}
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
      {active ? (
        <span className="text-[10px] uppercase font-semibold text-emerald-700">
          {t.tournamentsPage.bracket.winner}
        </span>
      ) : null}
    </div>
  );
}
