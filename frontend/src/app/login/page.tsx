'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authLogin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, ArrowRight, User, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authLogin(form);
      await checkAuth();
      router.push('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-orb login-orb-4" />
        <div className="login-grid-overlay" />
      </div>

      {/* Content */}
      <div className="login-content">
        {/* Logo & Welcome */}
        <div className="login-hero">
          <div className="login-logo-wrapper">
            <div className="login-logo">
              <Sparkles size={28} strokeWidth={2} />
            </div>
            <div className="login-logo-glow" />
          </div>
          <h1 className="login-title">
            Selamat Datang
          </h1>
          <p className="login-subtitle">
            Masuk ke <span className="login-brand-text">Rusydani Niken Couple</span> untuk kelola keuanganmu
          </p>
        </div>

        {/* Glass Card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {/* Error */}
            {error && (
              <div className="login-error animate-fade-in-up" style={{ opacity: 1 }}>
                <div className="login-error-dot" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className={`login-field ${focusedField === 'username' ? 'focused' : ''} ${form.username ? 'filled' : ''}`}>
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <div className="login-input-icon">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="login-input"
                  placeholder="Masukkan username"
                  autoComplete="username"
                  autoCapitalize="none"
                  id="login-username"
                />
              </div>
            </div>

            {/* Password */}
            <div className={`login-field ${focusedField === 'password' ? 'focused' : ''} ${form.password ? 'filled' : ''}`}>
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <div className="login-input-icon">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="login-input"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  id="login-password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-eye-btn"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="login-forgot-row">
              <Link href="/forgot-password" className="login-forgot-link">
                Lupa password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
              id="login-submit"
            >
              <span className="login-btn-bg" />
              <span className="login-btn-content">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </span>
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="login-footer">
          © 2026 Rusydani Niken Apps · v1.0.0
        </p>
      </div>
    </div>
  );
}
