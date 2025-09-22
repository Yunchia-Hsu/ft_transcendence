// App.tsx
import "./App.css";
import PongCanvas from "./pong/PongCanvas";
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';
import TwoFactor from './auth/TwoFactor';
import Enable2FA from './auth/Enable2FA';
import { useAuthStore } from './auth/store';
import { useEffect } from 'react';
import Banner from './ui/Banner';

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function NavBar() {
  const token = useAuthStore((s) => s.token);
  const tfa = useAuthStore((s) => s.twoFactorEnabled);
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="w-full flex items-center justify-between p-3 bg-gray-100">
      <div className="flex items-center gap-3">
        <Link to="/" className="font-semibold">Pong</Link>
        {token && !tfa && (
          <Link to="/enable-2fa" className="text-sm text-blue-700">Enable 2FA</Link>
        )}
      </div>
      <div className="text-sm">
        {token ? (
          <button onClick={logout} className="px-3 py-1 bg-gray-200 rounded">Logout</button>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-1 bg-blue-600 text-white rounded">Login</Link>
            <Link to="/register" className="px-3 py-1 bg-gray-200 rounded">Register</Link>
          </div>
        )}
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
