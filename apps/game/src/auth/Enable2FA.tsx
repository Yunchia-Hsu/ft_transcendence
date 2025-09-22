import { useEffect, useState } from 'react';
import { useAuthStore } from './store';
import { AuthApi } from './api';

export default function Enable2FA() {
  const token = useAuthStore((s) => s.token);
  const [qr, setQr] = useState<string | null>(null);
  const [manual, setManual] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!token) return;
        const res = await AuthApi.setup2fa(token);
        if (cancelled) return;
        setQr(res.qrCode);
        setManual(res.manualEntryKey);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to setup 2FA');
      }
    }
    run();
    return () => { cancelled = true; };
  }, [token]);

  async function onActivate(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!token) throw new Error('Not authenticated');
      await AuthApi.activate2fa(token, code);
      setMessage('Two-factor authentication enabled');
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to activate 2FA');
    }
  }

  return (
    <div className="container-page">
      <div className="card">
        <h1 className="text-xl font-semibold">Enable Two-Factor Authentication</h1>
        {error && <div className="text-error">{error}</div>}
        {message && <div className="text-success">{message}</div>}
        <div className="flex flex-col items-center gap-2">
          {qr ? (
            <>
              <img src={qr} alt="2FA QR" className="qr" />
              {manual && <div className="muted">Manual key: {manual}</div>}
            </>
          ) : (
            <div className="muted">Loading QR...</div>
          )}
        </div>
        <form onSubmit={onActivate} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Enter 6-digit code</label>
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
          <button className="btn btn-primary w-full" disabled={!qr || code.length !== 6}>
            Activate 2FA
          </button>
        </form>
      </div>
    </div>
  );
}


