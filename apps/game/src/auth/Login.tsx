import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './store';
import { useUiStore } from '../ui/store';
import { useTranslations, useErrorTranslator } from '../translations';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const showBanner = useUiStore((s) => s.showBanner);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const t = useTranslations();
  const translateError = useErrorTranslator();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await login({ username, password });
    if (result === '2fa') {
      navigate('/2fa');
    } else {
      showBanner(t.auth.banners.loginSuccess, 'success');
      navigate('/');
    }
  }

  return (
    <div className="container-page">
      <div className="card">
        <h1 className="text-xl font-semibold mb-4">{t.auth.titles.login}</h1>
        {error && <div className="text-error mb-3">{translateError(error)}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">{t.auth.labels.username}</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">{t.auth.labels.password}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? t.auth.actions.signingIn : t.auth.actions.signIn}
          </button>
        </form>
        <div className="text-sm mt-3">
          {t.auth.links.noAccount} <Link className="text-blue-600" to="/register">{t.auth.links.register}</Link>
        </div>
      </div>
    </div>
  );
}


