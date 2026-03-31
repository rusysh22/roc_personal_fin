'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Landmark, Loader2, Trash2, Check, Pencil, Calendar } from 'lucide-react';
import { getFinanceAccounts, createFinanceAccount, updateFinanceAccount, deleteFinanceAccount } from '@/lib/api';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FinanceAccount, FINANCE_ACCOUNT_TYPE_LABELS, FinanceAccountType, BALANCE_TYPE_LABELS, BalanceType } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';

const ACCOUNT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    type: 'bank' as FinanceAccountType, 
    balance_type: 'personal' as BalanceType, 
    initial_balance: '', 
    balance_date: new Date().toISOString().split('T')[0], 
    color: '#3b82f6', 
    include_in_dashboard: true,
    statement_day: null as number | null,
    due_day: null as number | null
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAccounts = () => {
    getFinanceAccounts()
      .then((res) => {
        const data = res.data;
        if (data && Array.isArray(data.results)) {
          setAccounts(data.results);
        } else if (Array.isArray(data)) {
          setAccounts(data);
        } else {
          setAccounts([]);
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAccounts(); }, []);

  const resetForm = () => {
    setForm({ 
      name: '', 
      type: 'bank', 
      balance_type: 'personal', 
      initial_balance: '', 
      balance_date: new Date().toISOString().split('T')[0], 
      color: '#3b82f6', 
      include_in_dashboard: true,
      statement_day: null,
      due_day: null
    });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (account: FinanceAccount) => {
    setForm({
      name: account.name, type: account.type,
      balance_type: account.balance_type || 'personal',
      initial_balance: String(Math.round(parseFloat(account.initial_balance))),
      balance_date: account.balance_date || new Date().toISOString().split('T')[0],
      color: account.color,
      include_in_dashboard: account.include_in_dashboard !== false,
      statement_day: account.statement_day,
      due_day: account.due_day,
    });
    setEditId(account.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.initial_balance) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name, type: form.type,
        balance_type: form.balance_type,
        initial_balance: form.initial_balance || '0',
        balance_date: form.balance_date,
        color: form.color,
        include_in_dashboard: form.include_in_dashboard,
      };
      if (editId) await updateFinanceAccount(editId, payload);
      else await createFinanceAccount(payload);
      resetForm();
      loadAccounts();
    } catch (err: any) { 
      const errorMsg = err.response?.data?.error || err.message || 'Gagal menyimpan perubahan';
      alert(errorMsg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try { await deleteFinanceAccount(id); loadAccounts(); }
    catch { /* ignore */ } finally { setDeletingId(null); }
  };

  const totalIncludedBalance = accounts
    .filter(acc => acc.include_in_dashboard !== false)
    .reduce((sum, acc) => sum + parseFloat(acc.current_balance || '0'), 0);
    
  const totalIncludedCount = accounts.filter(acc => acc.include_in_dashboard !== false).length;

  const groupedAccounts = accounts.reduce((groups: Record<string, FinanceAccount[]>, acc) => {
    const type = acc.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(acc);
    return groups;
  }, {});

  const accountTypes = Object.entries(FINANCE_ACCOUNT_TYPE_LABELS) as [FinanceAccountType, string][];

  return (
    <div className="pb-4">
      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-sheet animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '430px' }}>
            <div className="modal-handle" />
            <div className="px-5 pb-5">
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {editId ? 'Edit Akun/Bank' : 'Tambah Akun Baru'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Nama Bank / Dompet</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mobile-input" placeholder="Contoh: BCA, Gopay, Tunai" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Tipe</label>
                  <div className="flex flex-wrap gap-2">
                    {accountTypes.map(([key, label]) => (
                      <button key={key} onClick={() => setForm({ ...form, type: key })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={form.type === key
                          ? { background: 'var(--color-primary)', color: 'white' }
                          : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                        }>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Tipe Saldo</label>
                  <div className="flex gap-2">
                    {(Object.entries(BALANCE_TYPE_LABELS) as [BalanceType, string][]).map(([key, label]) => (
                      <button key={key} onClick={() => setForm({ ...form, balance_type: key })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={form.balance_type === key
                          ? { background: 'var(--color-primary)', color: 'white' }
                          : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                        }>
                        {key === 'personal' ? '👤' : '🏢'} {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Saldo Awal (Rp)</label>
                  <CurrencyInput 
                    value={form.initial_balance} 
                    onChange={(val) => setForm({ ...form, initial_balance: val })} 
                    className="mobile-input" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Saldo Per Tanggal</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                      <Calendar size={14} className="text-teal-500" />
                    </div>
                    <input
                      type="date"
                      value={form.balance_date}
                      onChange={(e) => setForm({ ...form, balance_date: e.target.value })}
                      className="mobile-input"
                      style={{ paddingLeft: '56px' }}
                    />
                  </div>
                  <p className="text-[10px] mt-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
                    Transaksi mulai tanggal ini akan dihitung terhadap saldo
                  </p>
                </div>
                {form.type === 'credit_card' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Tgl Statement</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.statement_day || ''}
                        onChange={(e) => setForm({ ...form, statement_day: e.target.value ? parseInt(e.target.value) : null })}
                        className="mobile-input"
                        placeholder="1-31"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Tgl Jatuh Tempo</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.due_day || ''}
                        onChange={(e) => setForm({ ...form, due_day: e.target.value ? parseInt(e.target.value) : null })}
                        className="mobile-input"
                        placeholder="1-31"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100/50 dark:border-teal-500/10 shadow-sm">
                  <div className="flex-1">
                    <p className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Hitung sebagai Saldo</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Muncul di total saldo Dashboard</p>
                  </div>
                  <button 
                    onClick={() => setForm({ ...form, include_in_dashboard: !form.include_in_dashboard })}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${form.include_in_dashboard ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${form.include_in_dashboard ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Warna Ikon</label>
                  <div className="flex gap-2 flex-wrap">
                    {ACCOUNT_COLORS.map((color) => (
                      <button key={color} onClick={() => setForm({ ...form, color })}
                        className="w-8 h-8 rounded-xl transition-all" style={{ background: color, outline: form.color === color ? '3px solid var(--color-primary)' : 'none', outlineOffset: '2px' }} />
                    ))}
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving || !form.name || !form.initial_balance}
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
            <h1 className="text-xl font-bold text-white">Master Akun & Saldo</h1>
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
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Saldo Keseluruhan</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
              {formatRupiah(String(totalIncludedBalance))}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Dihitung dari {totalIncludedCount} akun
              </p>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Total {accounts.length} akun
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : accounts.length === 0 ? (
          <div className="animate-fade-in-up" style={{ animationDelay: '60ms', opacity: 0 }}>
            <div className="mobile-card p-8 text-center">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))' }}>
                <Landmark size={28} className="text-blue-500" />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Belum ada akun bank/dompet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Tap + di atas untuk menambahkan</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-4 rounded-full bg-teal-500/50" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {FINANCE_ACCOUNT_TYPE_LABELS[type as FinanceAccountType]}
                  </h3>
                  <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800/50" />
                  <span className="text-[10px] font-medium text-slate-400">{typeAccounts.length} akun</span>
                </div>
                <div className="space-y-3">
                  {typeAccounts.map((acc, i) => (
                    <div key={acc.id} className="animate-fade-in-up mobile-card overflow-hidden" style={{ animationDelay: `${60 + i * 40}ms`, opacity: 0 }}>
                      <div className="p-4 cursor-pointer" onClick={() => openEdit(acc)}>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: `${acc.color}20` }}>
                            <Landmark size={20} style={{ color: acc.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{acc.name}</p>
                              {!acc.include_in_dashboard && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  Tersembunyi
                                </span>
                              )}
                            </div>
                            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                              {FINANCE_ACCOUNT_TYPE_LABELS[acc.type]} · {acc.balance_type === 'personal' ? '👤 Pribadi' : '🏢 Lainnya'}
                              {acc.balance_date && <> · per {formatDate(acc.balance_date)}</>}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatRupiah(acc.current_balance)}</p>
                          </div>
                          <div className="flex gap-1 ml-2 border-l pl-2" style={{ borderColor: 'var(--color-divider)' }}>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                              {deletingId === acc.id ? <Loader2 size={14} className="animate-spin text-red-400" /> : <Trash2 size={14} className="text-red-400" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
