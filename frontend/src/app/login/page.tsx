'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authLogin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, User, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { loginAndSetUser } = useAuth();
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
      const res = await authLogin(form);
      await loginAndSetUser(res.data.access_token, res.data.refresh_token);
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

      {/* Fullscreen Loading Overlay */}
      {loading && (
        <div className="login-loading-overlay">
          <div className="login-loading-content">
            <div className="login-loading-spinner">
              <div className="login-loading-ring" />
              <div className="login-loading-icon">
                <svg width="32" height="32" viewBox="0 0 192 192" fill="none">
                  <text x="96" y="120" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="80" fill="white">RN</text>
                </svg>
              </div>
            </div>
            <p className="login-loading-text">Sedang masuk...</p>
            <p className="login-loading-subtext">Memverifikasi akun kamu</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="login-content">
        {/* Logo & Welcome */}
        <div className="login-hero">
          <div className="login-logo-wrapper">
            <div className="login-logo">
              <svg width="36" height="36" viewBox="0 0 192 192" fill="none">
                <text x="96" y="120" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="80" fill="white">RN</text>
              </svg>
            </div>
            <div className="login-logo-glow" />
          </div>
          <p className="login-app-name">Rusydani Niken</p>
          <h1 className="login-title">
            Selamat Datang
          </h1>
          <p className="login-subtitle">
            Masuk untuk kelola planningmu
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
              <Link href="/forgot-password" prefetch={false} className="login-forgot-link">
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
                <span>Masuk</span>
                <ArrowRight size={18} />
              </span>
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="login-footer">
          &copy; 2026 Rusydani Niken Apps &middot; v1.2.0
        </p>
      </div>
    </div>
  );
}
