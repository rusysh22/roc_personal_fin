'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authRegister } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { loginAndSetUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await authRegister({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
      });
      await loginAndSetUser(res.data.access_token, res.data.refresh_token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
            <UserPlus size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Buat Akun</h1>
          <p className="text-sm text-white/70 mt-1">Mulai kelola keuanganmu</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 -mt-6 pb-8">
        <form onSubmit={handleSubmit} className="mobile-card p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl animate-fade-in-up">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Nama</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="mobile-input"
              placeholder="Nama kamu"
              autoComplete="given-name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Username</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mobile-input"
              placeholder="Pilih username"
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mobile-input"
              placeholder="email@kamu.com"
              autoComplete="email"
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="mobile-input"
              placeholder="Ulangi password"
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
              ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
              : <><UserPlus size={16} /> Daftar</>}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          Sudah punya akun?{' '}
          <Link href="/login" prefetch={false} className="font-bold" style={{ color: 'var(--color-primary)' }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
