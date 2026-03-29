'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Target, Loader2, Trash2, Check, Pencil } from 'lucide-react';
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '@/lib/api';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { SavingsGoal } from '@/types';
import { formatRupiah } from '@/lib/utils';

const GOAL_COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#10b981', '#06b6d4'];

export default function SavingsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '', deadline: '', color: '#0d9488' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [addAmountId, setAddAmountId] = useState<number | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const loadGoals = () => {
    getSavingsGoals()
      .then((res) => {
        const data = res.data;
        if (data && Array.isArray(data.results)) {
          setGoals(data.results);
        } else if (Array.isArray(data)) {
          setGoals(data);
        } else {
          setGoals([]);
        }
      })
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGoals(); }, []);

  const resetForm = () => {
    setForm({ name: '', target_amount: '', current_amount: '', deadline: '', color: '#0d9488' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (goal: SavingsGoal) => {
    setForm({
      name: goal.name, target_amount: goal.target_amount,
      current_amount: goal.current_amount, deadline: goal.deadline || '',
      color: goal.color,
    });
    setEditId(goal.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.target_amount) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, target_amount: form.target_amount || '0',
        current_amount: form.current_amount || '0', color: form.color,
      };
      if (form.deadline) payload.deadline = form.deadline;
      if (editId) await updateSavingsGoal(editId, payload);
      else await createSavingsGoal(payload);
      resetForm();
      loadGoals();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleAddAmount = async (goalId: number) => {
    if (!addAmount) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    setSaving(true);
    try {
      const newAmount = parseFloat(goal.current_amount) + parseFloat(addAmount);
      await updateSavingsGoal(goalId, {
        name: goal.name, target_amount: goal.target_amount,
        current_amount: String(newAmount), color: goal.color,
        deadline: goal.deadline,
      });
      setAddAmountId(null);
      setAddAmount('');
      loadGoals();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try { await deleteSavingsGoal(id); loadGoals(); }
    catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <div className="pb-4">
      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '430px' }}>
            <div className="modal-handle" />
            <div className="px-5 pb-5">
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {editId ? 'Edit Target' : 'Target Tabungan Baru'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Nama Target</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mobile-input" placeholder="Contoh: Dana Darurat, Liburan" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Target (Rp)</label>
                    <CurrencyInput 
                      value={form.target_amount} 
                      onChange={(val) => setForm({ ...form, target_amount: val })} 
                      className="mobile-input" 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Terkumpul (Rp)</label>
                    <CurrencyInput 
                      value={form.current_amount} 
                      onChange={(val) => setForm({ ...form, current_amount: val })} 
                      className="mobile-input" 
                      placeholder="0" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Deadline (opsional)</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mobile-input" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Warna</label>
                  <div className="flex gap-2 flex-wrap">
                    {GOAL_COLORS.map((color) => (
                      <button key={color} onClick={() => setForm({ ...form, color })}
                        className="w-8 h-8 rounded-xl transition-all" style={{ background: color, outline: form.color === color ? '3px solid var(--color-primary)' : 'none', outlineOffset: '2px' }} />
                    ))}
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving || !form.name || !form.target_amount}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 mt-2"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', boxShadow: '0 8px 24px rgba(13, 148, 136, 0.35)' }}>
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Check size={16} /> {editId ? 'Update' : 'Simpan'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center gap-3 mb-1 relative z-10">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Keuangan</p>
            <h1 className="text-xl font-bold text-white">Target Tabungan</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : goals.length === 0 ? (
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
            <div className="mobile-card p-8 text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(20, 184, 166, 0.1))' }}>
                <Target size={28} className="text-teal-500" />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Belum ada target tabungan</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Tap + untuk membuat target baru</p>
            </div>
          </div>
        ) : (
          <>
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Aktif</p>
                <div className="space-y-3">
                  {activeGoals.map((goal, i) => (
                    <div key={goal.id} className="animate-fade-in-up mobile-card overflow-hidden" style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}>
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${goal.color}20` }}>
                            <Target size={18} style={{ color: goal.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{goal.name}</p>
                            {goal.deadline && (
                              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Deadline: {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(goal)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500/10">
                              <Pencil size={14} style={{ color: 'var(--color-text-muted)' }} />
                            </button>
                            <button onClick={() => handleDelete(goal.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                              {deletingId === goal.id ? <Loader2 size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} className="text-red-400" />}
                            </button>
                          </div>
                        </div>
                        {/* Progress */}
                        <div className="mb-2">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span style={{ color: 'var(--color-text-muted)' }}>{formatRupiah(goal.current_amount)} / {formatRupiah(goal.target_amount)}</span>
                            <span className="font-bold" style={{ color: goal.color }}>{Math.round(goal.progress_percentage)}%</span>
                          </div>
                          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-filter-bg)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(goal.progress_percentage, 100)}%`, background: `linear-gradient(90deg, ${goal.color}cc, ${goal.color})` }} />
                          </div>
                        </div>
                        {/* Quick add */}
                        {addAmountId === goal.id ? (
                          <div className="flex gap-2 mt-3">
                            <CurrencyInput 
                              value={addAmount} 
                              onChange={(val) => setAddAmount(val)} 
                              className="mobile-input flex-1 !py-2 text-sm" 
                              placeholder="Jumlah" 
                            />
                            <button onClick={() => handleAddAmount(goal.id)} disabled={saving || !addAmount}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                              style={{ background: 'var(--color-primary)' }}>
                              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button onClick={() => { setAddAmountId(null); setAddAmount(''); }}
                              className="px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setAddAmountId(goal.id)}
                            className="w-full mt-2 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{ background: `${goal.color}10`, color: goal.color }}>
                            + Tambah Tabungan
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Tercapai 🎉</p>
                <div className="space-y-3">
                  {completedGoals.map((goal) => (
                    <div key={goal.id} className="mobile-card overflow-hidden opacity-70">
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-500/10">
                          <Check size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{goal.name}</p>
                          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{formatRupiah(goal.target_amount)} · Selesai!</p>
                        </div>
                        <button onClick={() => handleDelete(goal.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
