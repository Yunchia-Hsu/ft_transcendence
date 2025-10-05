// apps/game/src/app/App.tsx
import "./App.css";
import { useEffect } from "react";
import { PongCanvas } from "../features/game";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Login, Register, TwoFactor, Enable2FA } from "../features/auth";
import { Profile } from "../features/profile";
import { useAuthStore } from "../features/auth/store/auth.store";
import { Banner } from "../shared/components/ui";
import { useLang, LanguageCode } from "../localization";
import PlayPrompt from "@/features/game/pages/PlayPrompt";
import { TournamentsList } from "@/features/tournaments/pages/TournamentsList";
import { TournamentDetail } from "@/features/tournaments/pages/TournamentDetail";
import { QuickPlay } from "@/features/tournaments/matchmaking/QuickPlay";
import { FriendsPage } from "@/features/friends";
import { UsersApi } from "@/shared/api/users";

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function NavBar() {
  const { lang, setLang, t } = useLang();
  const token = useAuthStore((s) => s.token);
  const tfa = useAuthStore((s) => s.twoFactorEnabled);
  const logout = useAuthStore((s) => s.logout);

  return (
    <nav className="w-full bg-gray-100 border-b">
      <div className="mx-auto max-w-screen-xl px-3 py-2 flex flex-wrap items-center gap-2">
        {/* Left: brand + main nav */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="font-semibold truncate">
            {t.nav.appName}
          </Link>

          {token && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Link to="/profile" className="text-blue-700 hover:underline">
                {t.nav.profile}
              </Link>
              <Link to="/friends" className="text-blue-700 hover:underline">
                {t.nav.friends}
              </Link>
              <Link to="/tournaments" className="text-blue-700 hover:underline">
                {t.nav.tournaments}
              </Link>
              {!tfa && (
                <Link
                  to="/enable-2fa"
                  className="text-blue-700 hover:underline whitespace-nowrap"
                >
                  {t.nav.enable2fa}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right: language + auth controls */}
        {/* On small screens this block takes full width and moves to a second row */}
        <div className="ml-auto flex items-center gap-2 flex-wrap basis-full md:basis-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              className="px-2 py-1 border rounded h-8 shrink-0"
            >
              <option value="en">EN</option>
              <option value="ru">RU</option>
              <option value="zh">中文</option>
            </select>

            {token ? (
              <button
                onClick={logout}
                className="px-3 py-1 bg-gray-200 rounded h-8 shrink-0 whitespace-nowrap"
              >
                {t.nav.logout}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1 bg-blue-600 text-white rounded h-8 shrink-0 whitespace-nowrap"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1 bg-gray-200 rounded h-8 shrink-0 whitespace-nowrap"
                >
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const token = useAuthStore((s) => s.token);

  // Presence: set me online when app is active; offline on close.
  useEffect(() => {
    if (!token) return;

    let unloaded = false;

    const goOnline = () =>
      UsersApi.setMyStatus(token, "online").catch(() => {});

    const goOffline = () =>
      UsersApi.setMyStatus(token, "offline").catch(() => {});

    // initial online
    goOnline();

    // regain focus => online
    const onVisibility = () => {
      if (document.visibilityState === "visible") goOnline();
    };

    // best-effort offline on tab close (no auth header possible here)
    const onBeforeUnload = () => {
      unloaded = true;
      try {
        navigator.sendBeacon?.(
          "/api/users/me/status",
          new Blob([JSON.stringify({ status: "offline" })], {
            type: "application/json",
          })
        );
      } catch {
        // ignore
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (!unloaded) goOffline();
    };
  }, [token]);

  return (
    <BrowserRouter>
      <Banner />
      <NavBar />
      <Routes>
        {/* Home → funny prompt + Start button */}
        <Route
          path="/"
          element={
            <Protected>
              <PlayPrompt />
            </Protected>
          }
        />

        {/* Quick Play (matchmaking) */}
        <Route
          path="/quickplay"
          element={
            <Protected>
              <QuickPlay />
            </Protected>
          }
        />

        {/* Game canvas (navigated to after start/match) */}
        <Route
          path="/game/:gameId"
          element={
            <Protected>
              <div className="viewport">
                <PongCanvas />
              </div>
            </Protected>
          }
        />

        {/* Auth & profile */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/2fa" element={<TwoFactor />} />
        <Route
          path="/enable-2fa"
          element={
            <Protected>
              <Enable2FA />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />

        {/* Friends */}
        <Route
          path="/friends"
          element={
            <Protected>
              <FriendsPage />
            </Protected>
          }
        />

        {/* Tournaments */}
        <Route
          path="/tournaments"
          element={
            <Protected>
              <TournamentsList />
            </Protected>
          }
        />
        <Route
          path="/tournaments/:id"
          element={
            <Protected>
              <TournamentDetail />
            </Protected>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
