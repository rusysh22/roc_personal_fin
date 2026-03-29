'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCategories, createCategory } from '@/lib/api';
import { Category } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Plus, ArrowDownRight, ArrowUpRight, Loader2, Tags } from 'lucide-react';
import { useDialog } from '@/contexts/DialogContext';

const PRESET_COLORS = ['#0d9488', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#2dd4bf', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

export default function CategoriesPage() {
  const { showAlert } = useDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'expense', color: '#0d9488' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  const fetchCategories = useCallback(() => {
    setLoading(true);
    getCategories()
      .then((res) => setCategories(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCategory(form);
      setShowForm(false);
      setForm({ name: '', type: 'expense', color: '#0d9488' });
      fetchCategories();
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan kategori', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const displayed = activeTab === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="pb-2">
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '40px' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Pengaturan</p>
            <h1 className="text-xl font-bold text-white">Kategori</h1>
          </div>
          <div className="px-2.5 py-1 bg-white/20 rounded-xl">
            <span className="text-xs font-bold text-white">{categories.length} total</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-white/70'
            }`}
          >
            <ArrowDownRight size={15} />
            Pengeluaran
            <span className={`text-xs px-1.5 py-0.5 rounded-lg ${activeTab === 'expense' ? 'bg-rose-50 text-rose-400' : 'bg-white/20 text-white/70'}`}>
              {expenseCategories.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-white/70'
            }`}
          >
            <ArrowUpRight size={15} />
            Pemasukan
            <span className={`text-xs px-1.5 py-0.5 rounded-lg ${activeTab === 'income' ? 'bg-emerald-50 text-emerald-400' : 'bg-white/20 text-white/70'}`}>
              {incomeCategories.length}
            </span>
          </button>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-3">
        {loading ? (
          <div className="mobile-card overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--color-divider)' }}>
                <div className="w-10 h-10 animate-shimmer rounded-2xl" />
                <div className="h-4 w-28 animate-shimmer rounded-lg" />
              </div>
            ))}
          </div>
        ) : displayed.length > 0 ? (
          <div className="mobile-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '50ms', opacity: 0 }}>
            {displayed.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: '1px solid var(--color-divider)', animationDelay: `${100 + idx * 40}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color + '18' }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
                <span className="text-sm font-semibold flex-1" style={{ color: 'var(--color-text-card-title)' }}>{cat.name}</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mobile-card p-10 flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: '50ms', opacity: 0 }}>
            <div className="w-14 h-14 rounded-3xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <Tags className="text-teal-300" size={26} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Belum ada kategori</p>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Ketuk + untuk menambah kategori {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'}</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setForm({ ...form, type: activeTab }); setShowForm(true); }}
        className="fab"
      >
        <Plus size={22} />
      </button>

      {/* Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Kategori">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Nama Kategori</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mobile-input"
              placeholder="Makan, Transportasi, Gaji, dll"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Tipe</label>
            <div className="flex gap-2 p-1 rounded-2xl" style={{ background: 'var(--color-filter-bg)' }}>
              {(['expense', 'income'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    form.type === type
                      ? type === 'expense'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm'
                      : ''
                  }`}
                  style={form.type !== type ? { color: 'var(--color-text-muted)' } : {}}
                >
                  {type === 'expense' ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                  {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Warna</label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl cursor-pointer relative overflow-hidden shadow-sm"
                style={{ backgroundColor: form.color, border: '4px solid var(--color-filter-bg)' }}
              >
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-8 h-8 rounded-xl transition-all hover:scale-110 active:scale-95 ${
                      form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--color-filter-bg)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: form.color + '20' }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: form.color }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-card-title)' }}>{form.name || 'Nama kategori...'}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ border: '1px solid var(--color-border-input)', color: 'var(--color-text-secondary)' }}>Batal</button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
