import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { useUiStore } from '../ui/store';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const showBanner = useUiStore((s) => s.showBanner);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await register({ username, email, password });
    showBanner('Registration successful. Please log in.', 'success');
    navigate('/login');
  }

  return (
    <div className="container-page">
      <div className="card">
        <h1 className="text-xl font-semibold mb-4">Register</h1>
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
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <div className="text-sm mt-3">
          Have an account? <Link className="text-blue-600" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}


