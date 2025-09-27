import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../../../shared/store/ui.store';
import { useTranslations, useErrorTranslator } from '../../../localization';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const showBanner = useUiStore((s) => s.showBanner);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const t = useTranslations();
  const translateError = useErrorTranslator();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await register({ username, email, password });
    showBanner(t.auth.banners.registrationSuccess, 'success');
    navigate('/login');
  }

  return (
    <div className="container-page">
      <div className="card">
        <h1 className="text-xl font-semibold mb-4">{t.auth.titles.register}</h1>
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
            <label className="block text-sm mb-1">{t.auth.labels.email}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? t.auth.actions.creatingAccount : t.auth.actions.createAccount}
          </button>
        </form>
        <div className="text-sm mt-3">
          {t.auth.links.haveAccount} <Link className="text-blue-600" to="/login">{t.auth.links.login}</Link>
        </div>
      </div>
    </div>
  );
}


