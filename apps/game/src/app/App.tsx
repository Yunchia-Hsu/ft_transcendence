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

  const userProfile = useAuthStore((s) => s.userProfile);
  const fetchUserProfile = useAuthStore((s) => s.fetchUserProfile);

  // Load profile after hard refresh so header name persists
  useEffect(() => {
    if (token && !userProfile) void fetchUserProfile();
  }, [token, userProfile, fetchUserProfile]);

  const headerName =
    (userProfile?.displayname && userProfile.displayname.trim()) ||
    (userProfile?.username && userProfile.username.trim()) ||
    null;

  return (
    <nav className="w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-screen-xl px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* Left: brand */}
          <div className="flex-1 min-w-0">
            <Link
              to="/"
              className="font-semibold text-gray-900 hover:opacity-90 truncate"
            >
              {t.nav.appName}
            </Link>
          </div>

          {/* Center: main nav (hidden when logged out) */}
          {token && (
            <div className="order-last w-full md:order-none md:w-auto md:flex-1">
              <div className="flex justify-center gap-x-4 gap-y-2 text-sm flex-wrap">
                <Link
                  to="/profile"
                  className="text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                >
                  {t.nav.profile}
                </Link>
                <Link
                  to="/friends"
                  className="text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                >
                  {t.nav.friends}
                </Link>
                <Link
                  to="/tournaments"
                  className="text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                >
                  {t.nav.tournaments}
                </Link>
                {!tfa && (
                  <Link
                    to="/enable-2fa"
                    className="text-blue-700 hover:text-blue-800 hover:underline whitespace-nowrap transition-colors"
                  >
                    {t.nav.enable2fa}
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Right: controls */}
          <div className="flex items-center gap-2 md:justify-end md:flex-1">
            {token && headerName && (
              <Link
                to="/profile"
                title={headerName}
                className="
                  hidden sm:block max-w-[40vw] md:max-w-[20rem] truncate
                  text-sm font-semibold
                  bg-clip-text text-transparent
                  bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-600
                  hover:underline
                "
              >
                {headerName}
              </Link>
            )}

            {/* Language selector (subtle) */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              className="
                h-9 px-2 rounded-md border
                bg-white/70 hover:bg-white
                focus:outline-none focus:ring-2 focus:ring-blue-300
                transition-colors
              "
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="ru">RU</option>
              <option value="zh">中文</option>
            </select>

            {/* Auth buttons — nicer styles */}
            {token ? (
              <button
                onClick={logout}
                className="
                  h-9 px-3 rounded-md
                  bg-gray-200 hover:bg-gray-300
                  text-gray-800 font-medium
                  shadow-sm hover:shadow
                  focus:outline-none focus:ring-2 focus:ring-gray-300
                  transition-all
                  whitespace-nowrap
                "
              >
                {t.nav.logout}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="
                    h-9 px-4 rounded-md
                    bg-blue-600 hover:bg-blue-700
                    text-white font-semibold
                    shadow-sm hover:shadow
                    focus:outline-none focus:ring-2 focus:ring-blue-300
                    transition-all
                    whitespace-nowrap
                  "
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  className="
                    h-9 px-4 rounded-md
                    border border-gray-300 bg-white hover:bg-gray-50
                    text-gray-800 font-medium
                    shadow-sm hover:shadow
                    focus:outline-none focus:ring-2 focus:ring-gray-300
                    transition-all
                    whitespace-nowrap
                  "
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
