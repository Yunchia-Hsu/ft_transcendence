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
import { TournamentDashboard } from "./TournamentDashboard";
import { useLang } from "@/localization";

export function TournamentDetail() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const userProfile = useAuthStore((s) => s.userProfile);

  // Helper function to translate tournament status
  const getStatusTranslation = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return t.tournamentsPage.status.pending;
      case "ongoing":
        return t.tournamentsPage.status.ongoing;
      case "completed":
        return t.tournamentsPage.status.completed;
      case "cancelled":
        return t.tournamentsPage.status.cancelled;
      default:
        return status; // fallback
    }
  };

  const [detail, setDetail] = useState<TDetail | null>(null);
  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nick, setNick] = useState("");

  const needsUsername = useMemo(() => !userProfile?.username, [userProfile]);
  const hasDisplayName = useMemo(
    () =>
      !!userProfile?.displayname && userProfile.displayname.trim().length > 0,
    [userProfile]
  );

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
      // If your API returns { ok, ... }, keep this guard; otherwise assign directly.
      if ((b as any)?.ok) {
        setBracket(b as BracketResponse);
      } else {
        setBracket(b as BracketResponse);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const join = async () => {
    if (!id || !token || !canJoin) return;
    if (needsUsername && !nick.trim()) {
      // Username required before joining; prompt via required input
      return;
    }
    setBusy(true);
    try {
      const nicknameToSend =
        nick.trim() || (hasDisplayName ? userProfile!.displayname!.trim() : "");
      await TournamentsApi.join(id, token, nicknameToSend || undefined);
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

  if (loading || !detail) {
    return <div className="p-6">{t.game.tournaments.loading}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{detail.name}</h1>
          <div className="text-sm text-gray-600">
            {t.game.tournaments.status}{" "}
            <span>{getStatusTranslation(detail.status)}</span> •{" "}
            {t.game.tournaments.size}: {detail.size} •{" "}
            {t.game.tournaments.rounds} {detail.rounds}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            {t.game.tournaments.refresh}
          </button>
          {detail.status === "pending" ? (
            <>
              {(needsUsername || !hasDisplayName) && (
                <input
                  className="border px-3 py-1 rounded"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder={
                    needsUsername
                      ? t.profile.labels.username
                      : t.game.tournaments.nicknameOptional
                  }
                  required={needsUsername}
                />
              )}
              <button
                disabled={!canJoin || busy}
                onClick={join}
                className="px-3 py-1 bg-emerald-600 text-white rounded disabled:opacity-60"
              >
                {t.game.tournaments.join}
              </button>
              <button
                disabled={!canLeave || busy}
                onClick={leave}
                className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-60"
              >
                {t.game.tournaments.leave}
              </button>
              <button
                disabled={!canStart || busy}
                onClick={start}
                className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-60"
                title="Owner can start; server enforces permission"
              >
                {t.game.tournaments.start}
              </button>
            </>
          ) : null}
        </div>
      </header>

      <section className="p-4 border rounded-lg">
        <h2 className="font-semibold mb-3">
          {t.tournamentsPage.participants.title}
        </h2>
        {detail.participants.length === 0 ? (
          <p className="text-gray-600">
            {t.tournamentsPage.participants.nobodyYet}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {detail.participants.map((p) => (
              <li key={p.userId} className="px-2 py-1 bg-gray-100 rounded">
                {p.nickname}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="p-4 border rounded-lg">
        <h2 className="font-semibold mb-4">
          {t.tournamentsPage.bracket.title}
        </h2>
        {!bracket ? (
          <p className="text-gray-600">
            {t.tournamentsPage.bracket.noBracketYet}
          </p>
        ) : (
          <Bracket
            rounds={bracket.rounds}
            matches={bracket.matches}
            onReport={report}
            currentUserId={userId}
            disabled={busy || detail.status !== "ongoing"}
            showRematch={false} // hide any "Play again / Rematch" controls
          />
        )}
      </section>

      {/* Dashboard only when bracket data is available */}
      {bracket && (
        <TournamentDashboard
          detail={detail}
          bracket={bracket}
          currentUserId={userId}
          userName={userProfile?.displayname || userProfile?.username || null}
        />
      )}
    </div>
  );
}
