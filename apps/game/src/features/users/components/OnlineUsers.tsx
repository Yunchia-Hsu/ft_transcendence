import { useEffect, useState, useRef } from "react";
import { UsersApi, OnlineUser } from "@/shared/api/users";

export function OnlineUsers({ className = "" }: { className?: string }) {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const fetchOnce = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await UsersApi.getOnline();
      setUsers(data);
    } catch (e) {
      setErr("Failed to load online users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnce();
    timer.current = window.setInterval(fetchOnce, 5000) as unknown as number;
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, []);

  return (
    <div
      className={`rounded-2xl border bg-white/70 backdrop-blur p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Online users</h3>
        <span className="text-xs text-gray-500">{users.length}</span>
      </div>

      {loading && users.length === 0 ? (
        <div className="text-xs text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-xs text-rose-600">{err}</div>
      ) : users.length === 0 ? (
        <div className="text-xs text-gray-500">Nobody’s online… yet 👀</div>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.userid} className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-gray-600">
                    {u.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm">{u.displayname ?? u.username}</div>
                <div className="text-[10px] text-emerald-700">● online</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
