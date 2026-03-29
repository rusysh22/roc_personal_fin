'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { ArrowLeft, Plus, Loader2, Check, X, Tags, Trash2, Edit2 } from 'lucide-react';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { useDialog } from '@/contexts/DialogContext';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', 
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export default function CategoriesPage() {
  const { showAlert, showConfirm } = useDialog();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('📂');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => categories.filter(c => c.type === activeTab), [categories, activeTab]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType(activeTab);
    setIcon('📂');
    setColor(COLORS[0]);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon || '📂');
    setColor(cat.color || COLORS[0]);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm('Hapus Kategori?', { message: 'Semua transaksi yang menggunakan kategori ini akan kehilangan relasinya atau bisa error! Lanjutkan?' });
    if (!confirmed) return;
    try {
      await deleteCategory(id);
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert('Gagal menghapus kategori', { message: 'Mungkin kategori sudah dipakai di transaksi.', variant: 'error' });
    }
  };

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    const data = { name, type, icon, color };
    try {
      if (editingId) {
        await updateCategory(editingId, data);
      } else {
        await createCategory(data);
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan kategori', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-4">
      {/* Form Overlay */}
      {showForm && (
        <div className="fullpage-overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="w-full max-w-md bg-[var(--color-bg-app)] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-card)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {editingId ? 'Edit Kategori' : 'Kategori Baru'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center touch-feedback">
                <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Type Selection */}
              <div className="flex gap-2 p-1 rounded-2xl bg-black/5 dark:bg-white/5">
                {(['expense', 'income'] as const).map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      type === t 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                  </button>
                ))}
              </div>
              
              {/* Name & Emoji */}
              <div className="flex gap-2">
                <div className="w-[70px]">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Icon</label>
                  <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} className="mobile-input text-center text-xl" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Nama Kategori *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mobile-input" placeholder="Misal: Makan Malam" />
                </div>
              </div>

              {/* Color Grid */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-section-label)' }}>Warna</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-app)] scale-110 shadow-md' : 'active:scale-95'}`}
                      style={{ background: c, '--tw-ring-color': c } as any}>
                      {color === c && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving || !name}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 mt-2"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', boxShadow: '0 8px 24px var(--color-primary-transparent)' }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Check size={16} /> {editingId ? 'Simpan Perubahan' : 'Buat Kategori'}</>}
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
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Pencatatan</p>
            <h1 className="text-xl font-bold text-white">Kelola Kategori</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
        {/* Info Card */}
        <div className="mobile-card p-4 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
              <Tags size={24} className="text-pink-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Kategori</p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-card-title)' }}>{categories.length}</h2>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-1 rounded-2xl bg-black/5 dark:bg-white/5 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === t 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
            </button>
          ))}
        </div>

        {/* List Kategori */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '150ms', opacity: 0 }}>
          {loading ? (
            <SectionLoading height="250px" />
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredCategories.map(cat => (
                <div key={cat.id} className="mobile-card p-3 flex flex-col justify-between" style={{ minHeight: '110px' }}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: cat.color + '30', color: cat.color }}>
                      <span style={{ filter: 'brightness(1.2)' }}>{cat.icon || '📂'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleEdit(cat)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 touch-feedback">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-50 touch-feedback">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold mt-2" style={{ color: 'var(--color-text-card-title)' }}>{cat.name}</h3>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <Tags className="text-gray-400" size={24} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada kategori</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Tekan + untuk membuat kategori baru.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
