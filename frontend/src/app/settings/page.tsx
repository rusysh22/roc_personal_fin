'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Calendar, Wallet, CreditCard, Target, Moon, Bell,
  Info, Database, ShieldCheck, LogOut, User, Loader2, AlertTriangle, Building2, Tags
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { profilePhotoUrl } from '@/lib/utils';

interface SettingRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}

function SettingRow({ icon, iconBg, title, subtitle, right, onClick }: SettingRowProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left cursor-pointer"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
      </div>
      {right ?? <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} className="shrink-0" />}
    </div>
  );
}

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}

function Toggle({ value, onChange, color = '#0d9488' }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
      style={{ background: value ? color : 'var(--color-border-input)' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
        style={{ left: value ? '26px' : '2px' }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [reminder, setReminder] = useState(true);
  const [reminderHours, setReminderHours] = useState(12);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push('/login');
  };

  const userInitial = user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'User';

  return (
    <div className="pb-4">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '430px' }}>
            <div className="modal-handle" />
            <div className="px-6 pb-6 text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))' }}>
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Keluar dari Akun?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Kamu harus login kembali untuk mengakses akunmu</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                  style={{ background: 'var(--color-filter-bg)', color: 'var(--color-text-primary)' }}>Batal</button>
                <button onClick={handleLogout} disabled={loggingOut}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)' }}>
                  {loggingOut ? <><Loader2 size={16} className="animate-spin" /> Keluar...</> : <><LogOut size={16} /> Ya, Keluar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="mb-1">
          <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Preferensi</p>
          <h1 className="text-xl font-bold text-white">Pengaturan</h1>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
        {/* Profil section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
          <div className="mobile-card overflow-hidden cursor-pointer touch-feedback" onClick={() => router.push('/settings/profile')}>
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold text-white overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}>
                {user?.profile_photo ? (
                  <img src={profilePhotoUrl(user.profile_photo, 112)!} alt="Profile" className="w-full h-full object-cover" width={56} height={56} />
                ) : (
                  userInitial
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{fullName}</p>
                {user?.email && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>}
                {user?.username && <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>@{user.username}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-500/10">
                  <User size={16} className="text-teal-500" />
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div className="px-4 pb-3">
              <p className="text-[10px] font-medium px-2.5 py-1 rounded-full inline-block"
                style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08), rgba(20, 184, 166, 0.08))', color: 'var(--color-primary)' }}>
                Tap untuk edit profil →
              </p>
            </div>
          </div>
        </div>

        {/* Keuangan section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '40ms', opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Keuangan</p>
          <div className="mobile-card overflow-hidden">
            <SettingRow icon={<Building2 size={16} className="text-indigo-500" />} iconBg="bg-indigo-50 dark:bg-indigo-500/10"
              title="Master Environment" subtitle="Atur Family Sharing / Bisnis" onClick={() => router.push('/settings/company')} />
            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />
            <SettingRow icon={<Tags size={16} className="text-pink-500" />} iconBg="bg-pink-50 dark:bg-pink-500/10"
              title="Kategori Transaksi" subtitle="Edit/Hapus kategori" onClick={() => router.push('/settings/categories')} />
            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />
            <SettingRow icon={<Calendar size={16} className="text-orange-500" />} iconBg="bg-orange-50 dark:bg-orange-500/10"
              title="Tanggal Gajian" subtitle="Atur tanggal gajian bulanan" onClick={() => router.push('/settings/payday')} />
            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />
            <SettingRow icon={<Wallet size={16} className="text-blue-500" />} iconBg="bg-blue-50 dark:bg-blue-500/10"
              title="Kelola Akun / Saldo" subtitle="Atur saldo awal" onClick={() => router.push('/settings/accounts')} />
            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />
            <SettingRow icon={<CreditCard size={16} className="text-rose-500" />} iconBg="bg-rose-50 dark:bg-rose-500/10"
              title="Hutang & Cicilan" subtitle="Pantau tagihan rutin" onClick={() => router.push('/settings/debts')} />
            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />
            <SettingRow icon={<Target size={16} className="text-emerald-500" />} iconBg="bg-emerald-50 dark:bg-emerald-500/10"
              title="Target Tabungan" subtitle="Set goals finansial kamu" onClick={() => router.push('/settings/savings')} />
          </div>
        </div>

        {/* Aplikasi section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Aplikasi</p>
          <div className="mobile-card overflow-hidden">
            <SettingRow icon={<Moon size={16} className="text-teal-500" />} iconBg="bg-teal-50 dark:bg-teal-500/10"
              title="Mode Gelap" right={<Toggle value={isDark} onChange={toggleTheme} color="#0d9488" />} onClick={toggleTheme} />
            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />
            <SettingRow icon={<Bell size={16} className="text-orange-500" />} iconBg="bg-orange-50 dark:bg-orange-500/10"
              title="Pengingat Input" subtitle={reminder ? `Notifikasi jika ${reminderHours} jam tidak input` : 'Dinonaktifkan'}
              right={<Toggle value={reminder} onChange={setReminder} color="#0d9488" />} />
            {reminder && (
              <div className="px-4 pb-3 pt-1">
                <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Ingatkan setelah tidak input selama:</p>
                <div className="flex gap-2">
                  {[6, 12, 24].map((h) => (
                    <button key={h} onClick={() => setReminderHours(h)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${reminderHours === h ? 'text-white shadow-sm' : ''}`}
                      style={reminderHours === h
                        ? { background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }
                        : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }}>
                      {h} jam
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '160ms', opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Data</p>
          <div className="mobile-card overflow-hidden">
            <SettingRow icon={<Database size={16} className="text-teal-500" />} iconBg="bg-teal-50 dark:bg-teal-500/10"
              title="Export Data" subtitle="Unduh data keuangan (CSV)" onClick={() => router.push('/settings/export')} />
            <div className="mx-4" style={{ height: '1px', background: 'var(--color-divider)' }} />
            <SettingRow icon={<ShieldCheck size={16} className="text-cyan-500" />} iconBg="bg-cyan-50 dark:bg-cyan-500/10"
              title="Keamanan & Privasi" subtitle="Password, enkripsi data" onClick={() => router.push('/settings/security')} />
          </div>
        </div>

        {/* About section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '220ms', opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Tentang</p>
          <div className="mobile-card overflow-hidden">
            <SettingRow icon={<Info size={16} style={{ color: 'var(--color-text-muted)' }} />} iconBg="bg-gray-100 dark:bg-gray-500/10"
              title="Rusydani Niken Apps" subtitle="Versi 1.2.0"
              right={<span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>v1.2.0</span>} />
          </div>
        </div>

        {/* Logout button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '280ms', opacity: 0 }}>
          <button onClick={() => setShowLogoutConfirm(true)} disabled={loggingOut}
            className="w-full mobile-card overflow-hidden flex items-center gap-3 px-4 py-4 touch-feedback">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-500/10">
              <LogOut size={16} className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-red-500">Keluar dari Akun</p>
            <ChevronRight size={16} className="ml-auto text-red-300" />
          </button>
        </div>

        {/* App info card */}
        <div className="rounded-3xl p-5 text-center animate-fade-in-up"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary), var(--color-primary-light))', animationDelay: '340ms', opacity: 0 }}>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-white font-bold text-base">Rusydani Niken Apps</p>
          <p className="text-white/70 text-xs mt-1">Catat. Pantau. Kelola keuangan lebih cerdas. dilarang marah-marah, dilarang menunda-nunda jam mandi, dilarang begadanggggg sumpah, jarang2in beli kopi, made with FULL ❤️ Rusydani to Niken</p>
        </div>
      </div>
    </div>
  );
}
