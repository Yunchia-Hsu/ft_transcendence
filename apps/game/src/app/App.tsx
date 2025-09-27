import "./App.css";
import { PongCanvas } from '../features/game';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Login, Register, TwoFactor, Enable2FA } from '../features/auth';
import { Profile } from '../features/profile';
import { useAuthStore } from '../features/auth/store/auth.store';
import { useEffect } from 'react';
import { Banner } from '../shared/components/ui';
import { useLang, LanguageCode } from '../localization';

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function NavBar() {
  const { lang, setLang, t } = useLang();
  const token = useAuthStore((s) => s.token);
  const tfa = useAuthStore((s) => s.twoFactorEnabled);
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="w-full flex items-center justify-between p-3 bg-gray-100">
      <div className="flex items-center gap-3">
        <Link to="/" className="font-semibold">{t.nav.appName}</Link>
        {token && (
          <>
            <Link to="/profile" className="text-sm text-blue-700">{t.nav.profile}</Link>
            {!tfa && (
              <Link to="/enable-2fa" className="text-sm text-blue-700">{t.nav.enable2fa}</Link>
            )}
          </>
        )}
      </div>
      <div className="text-sm">
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LanguageCode)}
            className="px-2 py-1 border rounded"
          >
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="zh">中文</option>
          </select>
          {token ? (
            <button onClick={logout} className="px-3 py-1 bg-gray-200 rounded">{t.nav.logout}</button>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1 bg-blue-600 text-white rounded">{t.nav.login}</Link>
              <Link to="/register" className="px-3 py-1 bg-gray-200 rounded">{t.nav.register}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Banner />
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={
            <Protected>
              <div className="viewport"><PongCanvas /></div>
            </Protected>
          }
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
