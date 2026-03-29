'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Lock, Eye, EyeOff, Check, Loader2,
  Camera, KeyRound, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/api';
import { ImageCropper } from '@/components/ui/ImageCropper';

interface ToastMessage {
  type: 'success' | 'error';
  text: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Photo upload state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const userInitial = firstName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

  const hasProfileChanges = firstName !== (user?.first_name || '') ||
    lastName !== (user?.last_name || '') ||
    email !== (user?.email || '');

  const hasPasswordChanges = newPassword.length > 0;

  const canSave = hasProfileChanges || hasPasswordChanges;

  const handleSave = async () => {
    // Validate
    if (!firstName.trim()) {
      setToast({ type: 'error', text: 'Nama depan wajib diisi' });
      return;
    }
    if (!email.trim()) {
      setToast({ type: 'error', text: 'Email wajib diisi' });
      return;
    }

    if (hasPasswordChanges) {
      if (!currentPassword) {
        setToast({ type: 'error', text: 'Password saat ini wajib diisi' });
        return;
      }
      if (newPassword.length < 6) {
        setToast({ type: 'error', text: 'Password baru minimal 6 karakter' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setToast({ type: 'error', text: 'Konfirmasi password tidak cocok' });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      };

      if (hasPasswordChanges) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await updateProfile(payload);

      // If password was changed, backend returns new tokens
      if (res.data.access_token) {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
      }

      // Update context
      setUser(res.data);

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      setToast({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setToast({
        type: 'error',
        text: error.response?.data?.error || 'Gagal menyimpan perubahan',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profile_photo', croppedBlob, 'profile_photo.jpg');

      const res = await updateProfile(formData);
      setUser(res.data);
      setToast({ type: 'success', text: 'Foto profil diperbarui!' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Gagal mengunggah foto' });
    } finally {
      setUploadingPhoto(false);
      setImageToCrop(null);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('profile-photo-input')?.click();
  };

  return (
    <div className="pb-4">
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-[380px] w-[calc(100%-32px)] animate-fade-in-up"
          style={{ animationDelay: '0ms', opacity: 1 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-lg"
            style={{
              background: toast.type === 'success'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
            }}
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'success'
                ? <Check size={14} className="text-white" />
                : <AlertCircle size={14} className="text-white" />
              }
            </div>
            <p className="text-sm font-semibold text-white flex-1">{toast.text}</p>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Pengaturan</p>
            <h1 className="text-xl font-bold text-white">Profil Saya</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-5">
        {/* Avatar card */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
          <div className="mobile-card overflow-hidden">
            <div className="flex flex-col items-center py-6 px-4">
              <div className="relative mb-4">
                <button 
                  onClick={triggerFileInput}
                  disabled={uploadingPhoto}
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-lg relative overflow-hidden group touch-feedback"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary), var(--color-primary-light))',
                    boxShadow: '0 8px 24px rgba(13, 148, 136, 0.35)',
                  }}
                >
                  {user?.profile_photo ? (
                    <img 
                      src={user.profile_photo} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                  
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={24} className="text-white" />
                  </div>
                </button>

                <input 
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center shadow-md cursor-pointer"
                  style={{ background: 'var(--color-bg-card)', border: '2px solid var(--color-border-card)' }}
                  onClick={triggerFileInput}
                >
                  <Camera size={12} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>
              <p className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {firstName || user?.username || 'User'} {lastName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                @{user?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Info Pribadi section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '60ms', opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>
            Informasi Pribadi
          </p>
          <div className="mobile-card overflow-hidden p-4 space-y-4">
            {/* First Name */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                Nama Depan
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                  <User size={14} className="text-teal-500" />
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nama depan"
                  className="mobile-input"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                Nama Belakang
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <User size={14} className="text-blue-500" />
                </div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nama belakang (opsional)"
                  className="mobile-input"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                  <Mail size={14} className="text-orange-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="mobile-input"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 text-xs font-bold">@</span>
                </div>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="mobile-input opacity-60 cursor-not-allowed"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
              <p className="text-[10px] mt-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
                Username tidak dapat diubah
              </p>
            </div>
          </div>
        </div>

        {/* Keamanan section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '120ms', opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>
            Keamanan
          </p>
          <div className="mobile-card overflow-hidden">
            {/* Toggle Password Section */}
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 dark:bg-rose-500/10">
                <KeyRound size={16} className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Ubah Password</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {showPasswordSection ? 'Tutup form password' : 'Ganti password akun Anda'}
                </p>
              </div>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300"
                style={{
                  transform: showPasswordSection ? 'rotate(180deg)' : 'rotate(0deg)',
                  background: 'var(--color-filter-bg)',
                }}
              >
                <ArrowLeft size={12} className="-rotate-90" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </button>

            {/* Password Fields */}
            {showPasswordSection && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
                <div className="mx-0 mb-2" style={{ height: '1px', background: 'var(--color-divider)' }} />

                {/* Current Password */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-500/10 flex items-center justify-center">
                      <Lock size={14} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="mobile-input"
                      style={{ paddingLeft: '56px', paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    >
                      {showCurrentPassword
                        ? <EyeOff size={16} style={{ color: 'var(--color-text-muted)' }} />
                        : <Eye size={16} style={{ color: 'var(--color-text-muted)' }} />
                      }
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                      <Lock size={14} className="text-teal-500" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="mobile-input"
                      style={{ paddingLeft: '56px', paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    >
                      {showNewPassword
                        ? <EyeOff size={16} style={{ color: 'var(--color-text-muted)' }} />
                        : <Eye size={16} style={{ color: 'var(--color-text-muted)' }} />
                      }
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-[10px] mt-1 px-1 text-red-500">Minimal 6 karakter</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                      <Lock size={14} className="text-teal-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="mobile-input"
                      style={{ paddingLeft: '56px', paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    >
                      {showConfirmPassword
                        ? <EyeOff size={16} style={{ color: 'var(--color-text-muted)' }} />
                        : <Eye size={16} style={{ color: 'var(--color-text-muted)' }} />
                      }
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[10px] mt-1 px-1 text-red-500">Password tidak cocok</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '180ms', opacity: 0 }}>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40"
            style={{
              background: canSave && !saving
                ? 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))'
                : 'var(--color-filter-bg)',
              color: canSave && !saving ? 'white' : 'var(--color-text-muted)',
              boxShadow: canSave && !saving ? '0 8px 24px rgba(13, 148, 136, 0.35)' : 'none',
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check size={16} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>

      {showCropper && imageToCrop && (
        <ImageCropper 
          image={imageToCrop}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setShowCropper(false);
            setImageToCrop(null);
          }}
        />
      )}
    </div>
  );
}
