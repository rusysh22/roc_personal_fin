'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authForgotPassword, authVerifyOtp, authResetPassword } from '@/lib/api';
import { Eye, EyeOff, Loader2, KeyRound, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authForgotPassword(email);
      setSuccess('Kode OTP telah dikirim ke email kamu');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengirim OTP. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authVerifyOtp({ email, code });
      setSuccess('Kode OTP valid. Silakan buat password baru.');
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kode OTP tidak valid atau sudah expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await authResetPassword({ email, code, new_password: password });
      setSuccess('Password berhasil diubah!');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mereset password. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    email: { title: 'Lupa Password', subtitle: 'Masukkan email untuk menerima kode OTP', icon: Mail },
    otp: { title: 'Verifikasi OTP', subtitle: `Kode dikirim ke ${email}`, icon: ShieldCheck },
    reset: { title: 'Password Baru', subtitle: 'Buat password baru untuk akunmu', icon: KeyRound },
  };

  const current = stepTitles[step];
  const Icon = current.icon;

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: 'var(--color-bg-app)' }}>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
          paddingTop: 'calc(40px + var(--sat))',
          paddingBottom: '60px',
        }}
      >
        <div className="absolute top-[-20px] right-[-20px] w-[120px] h-[120px] bg-white/10 rounded-full" />
        <div className="px-6 relative z-10">
          <Link href="/login" prefetch={false} className="inline-flex items-center gap-1 text-white/80 text-sm mb-4 touch-feedback rounded-lg px-2 py-1 -ml-2">
            <ArrowLeft size={16} /> Kembali
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
            <Icon size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{current.title}</h1>
          <p className="text-sm text-white/70 mt-1">{current.subtitle}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-6 -mt-3 mb-2 relative z-10">
        <div className="flex gap-2">
          {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{
                background: i <= ['email', 'otp', 'reset'].indexOf(step) ? '#0d9488' : 'var(--color-border-input)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 -mt-1 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl mb-4 animate-fade-in-up">
            {error}
          </div>
        )}
        {success && step !== 'email' && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-medium px-4 py-3 rounded-xl mb-4 animate-fade-in-up">
            {success}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="mobile-card p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mobile-input"
                placeholder="email@kamu.com"
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 touch-feedback"
              style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
                : <><Mail size={16} /> Kirim Kode OTP</>}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="mobile-card p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Kode OTP</label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mobile-input text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="------"
                autoComplete="one-time-code"
              />
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Kode berlaku selama 10 menit</p>
            </div>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 touch-feedback"
              style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
                : <><ShieldCheck size={16} /> Verifikasi</>}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
              className="w-full py-2 text-sm font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Kirim ulang kode
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="mobile-card p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Password Baru</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mobile-input pr-12"
                  placeholder="Min. 6 karakter"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 touch-feedback rounded-lg"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Konfirmasi Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mobile-input"
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 touch-feedback"
              style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                : <><KeyRound size={16} /> Simpan Password</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
