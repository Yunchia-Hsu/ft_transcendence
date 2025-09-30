// apps/game/src/features/tournaments/pages/TournamentsList.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TournamentsApi } from "@/shared/api/tournaments";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLang } from "@/localization";
import type { TournamentListItem } from "@/shared/api/types";

export function TournamentsList() {
  const { t } = useLang();
  const token = useAuthStore((s) => s.token);

  // Helper function to translate tournament status
  const getStatusTranslation = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return t.tournamentsPage.status.pending;
      case 'ongoing':
        return t.tournamentsPage.status.ongoing;
      case 'completed':
        return t.tournamentsPage.status.completed;
      case 'cancelled':
        return t.tournamentsPage.status.cancelled;
      default:
        return status; // fallback to original status if not found
    }
  };
  const [items, setItems] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [size, setSize] = useState<number>(8);

  const canCreate = useMemo(
    () => !!token && name.trim().length > 0 && [2, 4, 8, 16, 32].includes(size),
    [token, name, size]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await TournamentsApi.list();
        if (alive) setItems(res.items);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const create = async () => {
    if (!token || !canCreate) return;
    setCreating(true);
    try {
      const t = await TournamentsApi.create(
        { name, type: "single_elim", size },
        token
      );
      setItems((prev) => [
        { id: t.id, name: t.name, status: t.status },
        ...prev,
      ]);
      setName("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{t.tournamentsPage.title}</h1>

      {/* Create */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="font-semibold mb-3">{t.tournamentsPage.createNew}</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm mb-1">{t.tournamentsPage.name}</label>
            <input
              className="border px-3 py-2 rounded w-64"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.tournamentsPage.placeholder}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t.tournamentsPage.size}</label>
            <select
              className="border px-3 py-2 rounded"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              {[4, 8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            disabled={!canCreate || creating}
            onClick={create}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {creating ? t.tournamentsPage.creating : t.tournamentsPage.create}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p>{t.tournamentsPage.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">{t.tournamentsPage.noTournaments}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((tournament) => (
            <li
              key={tournament.id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">{tournament.name}</div>
                <div className="text-sm text-gray-600">
                  {getStatusTranslation(tournament.status)}
                </div>
              </div>
              <Link
                to={`/tournaments/${tournament.id}`}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                {t.tournamentsPage.open}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
