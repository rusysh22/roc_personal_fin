'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CreditCard, Loader2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { getDebts, createDebt, updateDebt, deleteDebt } from '@/lib/api';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Debt, DEBT_TYPE_LABELS, DebtType } from '@/types';
import { formatRupiah } from '@/lib/utils';

export default function DebtsPage() {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'other' as DebtType, total_amount: '', paid_amount: '', monthly_payment: '', due_date: '1', notes: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDebts = () => {
    getDebts()
      .then((res) => {
        // Fallback checks for paginated and non-paginated DRF responses
        const data = res.data;
        if (data && Array.isArray(data.results)) {
          setDebts(data.results);
        } else if (Array.isArray(data)) {
          setDebts(data);
        } else {
          setDebts([]);
        }
      })
      .catch(() => setDebts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDebts(); }, []);

  const resetForm = () => {
    setForm({ name: '', type: 'other', total_amount: '', paid_amount: '', monthly_payment: '', due_date: '1', notes: '' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (debt: Debt) => {
    setForm({
      name: debt.name, type: debt.type, total_amount: debt.total_amount,
      paid_amount: debt.paid_amount, monthly_payment: debt.monthly_payment,
      due_date: String(debt.due_date), notes: debt.notes,
    });
    setEditId(debt.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.total_amount) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name, type: form.type,
        total_amount: form.total_amount || '0', paid_amount: form.paid_amount || '0',
        monthly_payment: form.monthly_payment || '0', due_date: parseInt(form.due_date) || 1,
        notes: form.notes,
      };
      if (editId) await updateDebt(editId, payload);
      else await createDebt(payload);
      resetForm();
      loadDebts();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteDebt(id);
      loadDebts();
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const totalDebt = debts.filter(d => d.is_active).reduce((sum, d) => sum + parseFloat(d.remaining || '0'), 0);
  const debtTypes = Object.entries(DEBT_TYPE_LABELS) as [DebtType, string][];
  const typeColors: Record<DebtType, string> = { paylater: '#8b5cf6', credit_card: '#ef4444', loan: '#3b82f6', installment: '#f59e0b', other: '#64748b' };

  return (
    <div className="pb-4">
      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '430px' }}>
            <div className="modal-handle" />
            <div className="px-5 pb-5">
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {editId ? 'Edit Hutang' : 'Tambah Hutang Baru'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Nama</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mobile-input" placeholder="Contoh: Shopee Paylater" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Tipe</label>
                  <div className="flex flex-wrap gap-2">
                    {debtTypes.map(([key, label]) => (
                      <button key={key} onClick={() => setForm({ ...form, type: key })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={form.type === key
                          ? { background: typeColors[key], color: 'white' }
                          : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                        }>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Total Hutang</label>
                    <CurrencyInput 
                      value={form.total_amount} 
                      onChange={(val) => setForm({ ...form, total_amount: val })} 
                      className="mobile-input" 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Sudah Dibayar</label>
                    <CurrencyInput 
                      value={form.paid_amount} 
                      onChange={(val) => setForm({ ...form, paid_amount: val })} 
                      className="mobile-input" 
                      placeholder="0" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Cicilan/Bulan</label>
                    <CurrencyInput 
                      value={form.monthly_payment} 
                      onChange={(val) => setForm({ ...form, monthly_payment: val })} 
                      className="mobile-input" 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Jatuh Tempo (tgl)</label>
                    <input type="number" min="1" max="31" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="mobile-input" placeholder="1" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Catatan</label>
                  <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mobile-input" placeholder="Opsional" />
                </div>
                <button onClick={handleSave} disabled={saving || !form.name || !form.total_amount}
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
            <h1 className="text-xl font-bold text-white">Hutang & Cicilan</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
        {/* Summary */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
          <div className="mobile-card p-4 text-center">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Sisa Hutang</p>
            <p className="text-2xl font-bold mt-1" style={{ color: totalDebt > 0 ? '#ef4444' : 'var(--color-primary)' }}>
              {formatRupiah(String(totalDebt))}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{debts.filter(d => d.is_active).length} hutang aktif</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : debts.length === 0 ? (
          <div className="animate-fade-in-up" style={{ animationDelay: '60ms', opacity: 0 }}>
            <div className="mobile-card p-8 text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))' }}>
                <Check size={28} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tidak ada hutang! 🎉</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Tap + untuk menambahkan</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map((debt, i) => (
              <div key={debt.id} className="animate-fade-in-up mobile-card overflow-hidden" style={{ animationDelay: `${60 + i * 40}ms`, opacity: 0 }}>
                <div className="p-4 cursor-pointer" onClick={() => openEdit(debt)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${typeColors[debt.type]}15` }}>
                      <CreditCard size={18} style={{ color: typeColors[debt.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{debt.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{DEBT_TYPE_LABELS[debt.type]} · Jatuh tempo tgl {debt.due_date}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(debt.id); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                      {deletingId === debt.id ? <Loader2 size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} className="text-red-400" />}
                    </button>
                  </div>
                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span style={{ color: 'var(--color-text-muted)' }}>Progres pembayaran</span>
                      <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{Math.round(debt.progress_percentage)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-filter-bg)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(debt.progress_percentage, 100)}%`, background: 'linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))' }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--color-text-muted)' }}>Sisa: <span className="font-bold text-red-500">{formatRupiah(debt.remaining)}</span></span>
                    {parseFloat(debt.monthly_payment) > 0 && (
                      <span style={{ color: 'var(--color-text-muted)' }}>Cicilan: {formatRupiah(debt.monthly_payment)}/bln</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
