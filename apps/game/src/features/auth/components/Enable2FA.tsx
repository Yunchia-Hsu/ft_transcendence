import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { AuthApi } from '../services/auth.api';
import { useTranslations, useErrorTranslator } from '../../../localization';

export default function Enable2FA() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const t = useTranslations();
  const translateError = useErrorTranslator();
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
      setMessage(t.auth.banners.twoFactorEnabled);
      setError(null);
      // Redirect to game after successful 2FA activation
      setTimeout(() => navigate('/'), 1500); // Short delay to show success message
    } catch (e: any) {
      setError(e?.message || 'Failed to activate 2FA');
    }
  }

  return (
    <div className="container-page">
      <div className="card">
        <h1 className="text-xl font-semibold">{t.auth.titles.enable2fa}</h1>
        {error && <div className="text-error">{translateError(error)}</div>}
        {message && <div className="text-success">{message}</div>}
        <div className="flex flex-col items-center gap-2">
          {qr ? (
            <>
              <img src={qr} alt="2FA QR" className="qr" />
              {manual && <div className="muted">{t.auth.labels.manualKey}: {manual}</div>}
            </>
          ) : (
            <div className="muted">{t.auth.labels.loadingQR}</div>
          )}
        </div>
        <form onSubmit={onActivate} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">{t.auth.labels.code}</label>
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
            {t.auth.actions.activate2fa}
          </button>
        </form>
      </div>
    </div>
  );
}


