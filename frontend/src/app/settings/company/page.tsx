'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Company, CompanyMember } from '@/types';
import { getCompanies, createCompany, updateCompany, deleteCompany, getCompanyMembers, createCompanyMember, deleteCompanyMember } from '@/lib/api';
import { Building2, Plus, ArrowLeft, Loader2, Trash2, Users, Check, X, Pencil } from 'lucide-react';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { useDialog } from '@/contexts/DialogContext';

export default function CompanySettingsPage() {
  const { showAlert, showConfirm } = useDialog();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Create forms
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  const [showMemberForm, setShowMemberForm] = useState<number | null>(null); // company id
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member');
  const [savingMember, setSavingMember] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, memRes] = await Promise.all([
        getCompanies(),
        getCompanyMembers(),
      ]);
      setCompanies(compRes.data.results || compRes.data);
      setMembers(memRes.data.results || memRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyName) return;
    setSavingCompany(true);
    try {
      if (editingCompanyId) {
        await updateCompany(editingCompanyId, { name: companyName, description: companyDesc });
      } else {
        await createCompany({ name: companyName, description: companyDesc });
      }
      setShowCompanyForm(false);
      setEditingCompanyId(null);
      setCompanyName('');
      setCompanyDesc('');
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert(`Gagal ${editingCompanyId ? 'mengupdate' : 'membuat'} perusahaan`, { variant: 'error' });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleEditCompany = (comp: Company) => {
    setCompanyName(comp.name);
    setCompanyDesc(comp.description || '');
    setEditingCompanyId(comp.id);
    setShowCompanyForm(true);
  };

  const handleDeleteCompany = async (id: number) => {
    const confirmed = await showConfirm('Hapus Perusahaan?', { message: 'Yakin ingin menghapus perusahaan ini? Semua data terkait mungkin akan hilang atau tidak bisa diakses!' });
    if (!confirmed) return;
    try {
      await deleteCompany(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (companyId: number) => {
    if (!memberEmail) return;
    setSavingMember(true);
    try {
      await createCompanyMember({ email: memberEmail, company: companyId, role: memberRole });
      setShowMemberForm(null);
      setMemberEmail('');
      setMemberRole('member');
      fetchData();
    } catch (err: any) {
      console.error(err);
      showAlert(err.response?.data?.error || 'Gagal menambahkan anggota', { message: 'Pastikan email terdaftar.', variant: 'error' });
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (id: number) => {
    const confirmed = await showConfirm('Hapus Anggota?', { message: 'Hapus anggota ini dari perusahaan?' });
    if (!confirmed) return;
    try {
      await deleteCompanyMember(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-2">
      {/* Forms Overlay */}
      {showCompanyForm && (
        <div className="fullpage-overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="w-full max-w-md bg-[var(--color-bg-app)] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-card)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {editingCompanyId ? 'Edit Perusahaan' : 'Buat Perusahaan'}
              </h2>
              <button 
                onClick={() => {
                  setShowCompanyForm(false);
                  setEditingCompanyId(null);
                  setCompanyName('');
                  setCompanyDesc('');
                }} 
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center touch-feedback"
              >
                <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Nama Perusahaan *</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="mobile-input" placeholder="Contoh: PT Koding Kita" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Deskripsi</label>
                <input type="text" value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} className="mobile-input" placeholder="Opsional" />
              </div>
              <button onClick={handleSaveCompany} disabled={savingCompany || !companyName}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 mt-2"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', boxShadow: '0 8px 24px var(--color-primary-transparent)' }}>
                {savingCompany ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Check size={16} /> {editingCompanyId ? 'Update Perusahaan' : 'Buat Perusahaan'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMemberForm !== null && (
        <div className="fullpage-overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="w-full max-w-md bg-[var(--color-bg-app)] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-card)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Tambah Anggota</h2>
              <button onClick={() => setShowMemberForm(null)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center touch-feedback">
                <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Email User *</label>
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} className="mobile-input" placeholder="Masukkan email terdaftar" />
                <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Catatan: User harus sudah mendaftar (signup) sebelumnya.</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Role</label>
                <div className="flex gap-2">
                  <button onClick={() => setMemberRole('member')} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${memberRole === 'member' ? 'ring-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 ring-indigo-500' : 'bg-black/5'}`} style={memberRole !== 'member' ? { color: 'var(--color-text-secondary)' } : {}}>Member</button>
                  <button onClick={() => setMemberRole('admin')} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${memberRole === 'admin' ? 'ring-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 ring-indigo-500' : 'bg-black/5'}`} style={memberRole !== 'admin' ? { color: 'var(--color-text-secondary)' } : {}}>Admin</button>
                </div>
              </div>
              <button onClick={() => handleAddMember(showMemberForm)} disabled={savingMember || !memberEmail}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 mt-2"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', boxShadow: '0 8px 24px var(--color-primary-transparent)' }}>
                {savingMember ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Check size={16} /> Tambah Anggota</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center gap-3 mb-1 relative z-10">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Keuangan</p>
            <h1 className="text-xl font-bold text-white">Master Environtment</h1>
          </div>
          <button onClick={() => {
            setEditingCompanyId(null);
            setCompanyName('');
            setCompanyDesc('');
            setShowCompanyForm(true);
          }} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
        {/* Info Card */}
        <div className="mobile-card p-4 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Building2 size={24} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Perusahaan</p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-card-title)' }}>{companies.length}</h2>
            </div>
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Buat "Company" atau "Perusahaan" untuk memisahkan pencatatan keuangan bisnis dan keluarga dengan mengundang user lain (Family Sharing).
          </p>
        </div>

        {/* List Perusahaan */}
        <div className="space-y-4 mt-4 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
          {loading ? (
            <SectionLoading height="200px" />
          ) : companies.length > 0 ? (
            companies.map(comp => {
              // Ambil daftar member yang terafiliasi ke perusahaan ini
              const compMembers = members.filter(m => m.company === comp.id);
              // Cek role user saat ini (dapat dari list members yang id usernya ada, meski kita hanya cek 'role' jika ia bukan yg terhapus, dsb)
              // Since API returns only members in companies the user is part of, we can just aggregate them.
              return (
                <div key={comp.id} className="mobile-card overflow-hidden">
                  <div className="p-4" style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'var(--color-primary)' }}>
                          {comp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-card-title)' }}>{comp.name}</h3>
                          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{comp.description || 'Tidak ada deskripsi'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleEditCompany(comp)} className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-500">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteCompany(comp.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 text-rose-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Member List */}
                  <div className="p-3 bg-black/5 dark:bg-white/5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--color-section-label)' }}>
                        <Users size={12} /> Daftar Anggota
                      </h4>
                      <button onClick={() => setShowMemberForm(comp.id)} className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                        <Plus size={12} /> Tambah User
                      </button>
                    </div>

                    <div className="space-y-2">
                      {compMembers.length === 0 ? (
                        <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-muted)' }}>Belum ada anggota ditarik.</p>
                      ) : (
                        compMembers.map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-[var(--color-bg-card)] p-2.5 rounded-xl border" style={{ borderColor: 'var(--color-border-card)' }}>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                {m.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{m.username}</p>
                                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{m.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase">{m.role}</span>
                              {m.role !== 'owner' && (
                                <button onClick={() => handleDeleteMember(m.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg">
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3">
                <Building2 className="text-indigo-400" size={30} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Belum ada perusahaan/company</p>
              <p className="text-xs mt-1 max-w-[250px]" style={{ color: 'var(--color-text-muted)' }}>
                Tekan tombol + di atas untuk membuat profil company keluarga atau bisnismu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
