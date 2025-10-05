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

type Banner = { kind: "info" | "error" | "success"; text: string } | null;

export function TournamentDetail() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const userProfile = useAuthStore((s) => s.userProfile);

  // Helper: translate tournament status
  const getStatusTranslation = (status: string) => {
    switch ((status || "").toLowerCase()) {
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
  const [banner, setBanner] = useState<Banner>(null);

  // Derived
  const needsUsername = useMemo(() => !userProfile?.username, [userProfile]);
  const hasDisplayName = useMemo(
    () =>
      !!userProfile?.displayname && userProfile.displayname.trim().length > 0,
    [userProfile]
  );
  const pending = detail?.status === "pending";

  // Detect owner/creator from common field names
  const isOwner = useMemo(() => {
    if (!detail || !userId) return false;
    const ownerId =
      (detail as any).ownerId ??
      (detail as any).createdBy ??
      (detail as any).organizerId ??
      (detail as any).creatorId ??
      null;
    return !!ownerId && ownerId === userId;
  }, [detail, userId]);

  // Is current user already a participant?
  const isParticipant = useMemo(() => {
    if (!detail || !userId) return false;
    return detail.participants?.some((p: any) => p.userId === userId) ?? false;
  }, [detail, userId]);

  // Buttons left clickable so your custom messages appear on click
  const canJoinVisible = !!token && pending;
  const canLeaveVisible = !!token && pending;
  const canStartVisible = !!token && pending;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setBanner(null);
    try {
      const d = (await TournamentsApi.get(id)) as TDetail;
      setDetail(d);
      const b = await TournamentsApi.bracket(id);
      setBracket(
        (b as any)?.ok ? (b as BracketResponse) : (b as BracketResponse)
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const show = (kind: Banner["kind"], text: string) =>
    setBanner({ kind, text });

  const join = async () => {
    if (!id || !token || !canJoinVisible) return;

    // Already joined
    if (isParticipant) {
      show("info", "You can’t join twice.");
      return;
    }

    // Username required before joining (client-side guard)
    if (needsUsername) {
      show(
        "error",
        "You need to set a username in your profile before joining."
      );
      return;
    }

    setBusy(true);
    setBanner(null);
    try {
      const nicknameToSend =
        nick.trim() || (hasDisplayName ? userProfile!.displayname!.trim() : "");
      await TournamentsApi.join(id, token, nicknameToSend || undefined);
      show("success", "Joined the tournament.");
      await load();
    } catch (e: any) {
      // Server validation mapping
      if (e?.status === 400) {
        show("error", "Please enter a nickname to join.");
      } else if (e?.status === 409) {
        // Could be "already joined" or other prereq
        if (needsUsername) {
          show(
            "error",
            "You need to set a username in your profile before joining."
          );
        } else {
          show("info", "You can’t join twice.");
        }
      } else {
        show("error", e?.message || "Failed to join.");
      }
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!id || !token || !canLeaveVisible) return;

    // NEW: creators can't leave their own tournament
    if (isOwner) {
      show("info", "You created this tournament — you can’t leave.");
      return;
    }

    // Not a participant
    if (!isParticipant) {
      show("info", "You haven’t joined — you can’t leave.");
      return;
    }

    setBusy(true);
    setBanner(null);
    try {
      await TournamentsApi.leave(id, token);
      show("success", "Left the tournament.");
      await load();
    } catch (e: any) {
      if (e?.status === 409) {
        // e.g., bracket locked or additional server rules
        show(
          "error",
          isOwner
            ? "Creators can’t leave their own tournament."
            : "You can’t leave right now."
        );
      } else {
        show("error", e?.message || "Failed to leave.");
      }
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (!id || !token || !canStartVisible) return;

    // Not an owner
    if (!isOwner) {
      show("info", "Only the tournament creator can start.");
      return;
    }

    setBusy(true);
    setBanner(null);
    try {
      await TournamentsApi.start(id, token);
      show("success", "Tournament started.");
      await load();
    } catch (e: any) {
      show("error", e?.message || "Failed to start.");
    } finally {
      setBusy(false);
    }
  };

  const report = async (
    round: number,
    matchIndex: number,
    winnerUserId: string
  ) => {
    if (!id || !token || detail?.status !== "ongoing") return;
    setBusy(true);
    setBanner(null);
    try {
      await TournamentsApi.recordResult(id, token, {
        round,
        matchIndex,
        winnerUserId,
      });
      await load();
    } catch (e: any) {
      show("error", e?.message || "Failed to report result.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !detail) {
    return <div className="p-6">{t.game.tournaments.loading}</div>;
  }

  const BannerEl = banner && (
    <div
      className={[
        "mt-3 rounded px-3 py-2 text-sm",
        banner.kind === "error"
          ? "bg-red-100 text-red-800"
          : banner.kind === "success"
            ? "bg-green-100 text-green-800"
            : "bg-amber-100 text-amber-800",
      ].join(" ")}
      role={banner.kind === "error" ? "alert" : "status"}
    >
      {banner.text}
    </div>
  );

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
          {BannerEl}
          {detail.status === "pending" && !isOwner && (
            <div className="mt-2 text-xs text-gray-600">
              Only the tournament creator can start.
            </div>
          )}
          {detail.status === "pending" && needsUsername && (
            <div className="mt-1 text-xs text-gray-600">
              You need a username before joining.
            </div>
          )}
          {detail.status === "pending" && isOwner && (
            <div className="mt-1 text-xs text-gray-600">
              Creators can’t leave their own tournament.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void load()}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            {t.game.tournaments.refresh}
          </button>

          {detail.status === "pending" ? (
            <>
              {/* Optional nickname field (backend may still require username separately) */}
              <input
                className="border px-3 py-1 rounded"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder={
                  needsUsername
                    ? t.profile.labels.username
                    : t.game.tournaments.nicknameOptional
                }
              />

              {/* Join: enabled so your custom messages appear on click */}
              <button
                onClick={join}
                disabled={busy || !token}
                className={[
                  "px-3 py-1 rounded text-white disabled:opacity-60",
                  "bg-emerald-600",
                  isParticipant ? "opacity-90" : "",
                ].join(" ")}
                title={
                  isParticipant
                    ? "You’re already a participant"
                    : needsUsername
                      ? "Set a username before joining"
                      : ""
                }
              >
                {t.game.tournaments.join}
              </button>

              {/* Leave: enabled so your custom messages appear on click */}
              <button
                onClick={leave}
                disabled={busy || !token}
                className={[
                  "px-3 py-1 rounded text-white disabled:opacity-60",
                  "bg-yellow-500",
                  !isParticipant || isOwner ? "opacity-90" : "",
                ].join(" ")}
                title={
                  isOwner
                    ? "Creators can’t leave their own tournament"
                    : !isParticipant
                      ? "You haven’t joined — you can’t leave"
                      : ""
                }
              >
                {t.game.tournaments.leave}
              </button>

              {/* Start: enabled so your custom message appears on click */}
              <button
                onClick={start}
                disabled={busy || !token}
                className={[
                  "px-3 py-1 rounded text-white disabled:opacity-60",
                  "bg-indigo-600",
                  !isOwner ? "opacity-90" : "",
                ].join(" ")}
                title={!isOwner ? "Only the tournament creator can start" : ""}
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
