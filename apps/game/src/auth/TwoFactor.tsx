import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { useUiStore } from '../ui/store';

export default function TwoFactor() {
  const navigate = useNavigate();
  const verify2fa = useAuthStore((s) => s.verify2fa);
  const showBanner = useUiStore((s) => s.showBanner);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const [code, setCode] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await verify2fa(code);
    showBanner('Two-factor verification successful.', 'success');
    navigate('/');
  }

  return (
    <div className="container-page">
      <div className="card">
        <h1 className="text-xl font-semibold mb-4">Two-Factor Verification</h1>
        {error && <div className="text-error mb-3">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">6-digit code</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="input input-otp"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}


