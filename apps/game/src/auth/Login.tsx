import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './store';
import { useUiStore } from '../ui/store';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const showBanner = useUiStore((s) => s.showBanner);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await login({ username, password });
    if (result === '2fa') {
      navigate('/2fa');
    } else {
      showBanner('Login successful.', 'success');
      navigate('/');
    }
  }

  return (
    <div className="container-page">
      <div className="card">
        <h1 className="text-xl font-semibold mb-4">Login</h1>
        {error && <div className="text-error mb-3">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="text-sm mt-3">
          No account? <Link className="text-blue-600" to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}


