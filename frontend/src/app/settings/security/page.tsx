'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, ShieldCheck, Fingerprint, Lock, ChevronRight } from 'lucide-react';

export default function SecurityPage() {
  const router = useRouter();

  return (
    <div className="pb-4">
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Data</p>
            <h1 className="text-xl font-bold text-white">Keamanan & Privasi</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-5">
        {/* Status */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
          <div className="mobile-card p-5 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))' }}>
              <ShieldCheck size={28} className="text-emerald-500" />
            </div>
            <p className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Akun Aman</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Data kamu terenkripsi dan terlindungi</p>
          </div>
        </div>

        {/* Security options */}
        <div className="animate-fade-in-up" style={{ animationDelay: '60ms', opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Pengaturan Keamanan</p>
          <div className="mobile-card overflow-hidden">
            {/* Change Password */}
            <div
              role="button"
              onClick={() => router.push('/settings/profile')}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left cursor-pointer"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 dark:bg-rose-500/10">
                <KeyRound size={16} className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Ubah Password</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Ganti password akun kamu</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>

            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />

            {/* Session Info */}
            <div className="w-full flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-500/10">
                <Lock size={16} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Session Login</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Sesi aktif dan terlindungi</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">Aktif</span>
            </div>

            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />

            {/* Data Encryption */}
            <div className="w-full flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 dark:bg-purple-500/10">
                <Fingerprint size={16} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Enkripsi Data</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Data tersimpan terenkripsi di server</p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">Aktif</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="animate-fade-in-up" style={{ animationDelay: '120ms', opacity: 0 }}>
          <div className="mobile-card p-4">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              🔒 Kami mengutamakan keamanan data kamu. Semua data finansial disimpan secara
              terenkripsi dan hanya bisa diakses oleh pemilik akun. Password disimpan
              menggunakan hashing yang aman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
