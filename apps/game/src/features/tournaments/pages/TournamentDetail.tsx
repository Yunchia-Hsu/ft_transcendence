// apps/game/src/features/tournaments/pages/TournamentDetail.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { TournamentsApi } from "@/shared/api/tournaments";
import type {
  TournamentDetail as TDetail,
  BracketResponse,
} from "@/shared/api/types";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Bracket } from "../components/Bracket";

export function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [detail, setDetail] = useState<TDetail | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nick, setNick] = useState("");

  const canJoin = useMemo(
    () => !!token && detail?.status === "pending",
    [token, detail]
  );
  const canLeave = canJoin; // same condition (pending)
  const canStart = useMemo(
    () => !!token && detail?.status === "pending",
    [token, detail]
  );
  const canReport = useMemo(
    () => !!token && detail?.status === "ongoing",
    [token, detail]
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = (await TournamentsApi.get(id)) as TDetail;
      setDetail(d);
      const b = await TournamentsApi.bracket(id);
      if (b.ok) setBracket(b);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const join = async () => {
    if (!id || !token || !canJoin) return;
    setBusy(true);
    try {
      await TournamentsApi.join(id, token, nick.trim() || undefined);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!id || !token || !canLeave) return;
    setBusy(true);
    try {
      await TournamentsApi.leave(id, token);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (!id || !token || !canStart) return;
    setBusy(true);
    try {
      await TournamentsApi.start(id, token);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const report = async (
    round: number,
    matchIndex: number,
    winnerUserId: string
  ) => {
    if (!id || !token || !canReport) return;
    setBusy(true);
    try {
      await TournamentsApi.recordResult(id, token, {
        round,
        matchIndex,
        winnerUserId,
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading || !detail) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{detail.name}</h1>
          <div className="text-sm text-gray-600">
            Status: <span className="capitalize">{detail.status}</span> • Size:{" "}
            {detail.size} • Rounds: {detail.rounds}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            Refresh
          </button>
          {detail.status === "pending" ? (
            <>
              <input
                className="border px-3 py-1 rounded"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Nickname (optional)"
              />
              <button
                disabled={!canJoin || busy}
                onClick={join}
                className="px-3 py-1 bg-emerald-600 text-white rounded disabled:opacity-60"
              >
                Join
              </button>
              <button
                disabled={!canLeave || busy}
                onClick={leave}
                className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-60"
              >
                Leave
              </button>
              <button
                disabled={!canStart || busy}
                onClick={start}
                className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-60"
                title="Owner can start; server enforces permission"
              >
                Start
              </button>
            </>
          ) : null}
        </div>
      </header>

      <section className="p-4 border rounded-lg">
        <h2 className="font-semibold mb-3">Participants</h2>
        {detail.participants.length === 0 ? (
          <p className="text-gray-600">Nobody yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {detail.participants.map((p) => (
              <li key={p.userId} className="px-2 py-1 bg-gray-100 rounded">
                {p.nickname}{" "}
                <span className="text-gray-500 text-xs">
                  ({p.userId.slice(0, 6)}…)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="p-4 border rounded-lg">
        <h2 className="font-semibold mb-4">Bracket</h2>
        {!bracket ? (
          <p className="text-gray-600">No bracket yet.</p>
        ) : (
          <Bracket
            rounds={bracket.rounds}
            matches={bracket.matches}
            onReport={report}
            currentUserId={userId}
            disabled={busy || detail.status !== "ongoing"}
          />
        )}
      </section>
    </div>
  );
}
