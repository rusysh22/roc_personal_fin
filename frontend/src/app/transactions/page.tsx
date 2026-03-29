'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTransactions, deleteTransaction } from '@/lib/api';
import { Transaction, PAYMENT_METHOD_LABELS, PaymentMethod } from '@/types';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Plus, ArrowUpRight, ArrowDownRight, Receipt, SlidersHorizontal, X } from 'lucide-react';

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵',
  bank_transfer: '🏦',
  credit_card: '💳',
  paylater: '⏰',
  e_wallet: '📱',
  cod: '📦',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ type: '', payment_method: '', balance_type: '' });

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.type) params.type = filters.type;
    if (filters.payment_method) params.payment_method = filters.payment_method;
    if (filters.balance_type) params.balance_type = filters.balance_type;
    getTransactions(params)
      .then((res) => setTransactions(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction(id);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  const activeFilterCount = [filters.type, filters.payment_method, filters.balance_type].filter(Boolean).length;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <div className="pb-2">
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '40px' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Pencatatan</p>
            <h1 className="text-xl font-bold text-white">Transaksi</h1>
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="relative w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20 touch-feedback"
            aria-label="Filter transaksi"
          >
            <SlidersHorizontal size={18} className="text-white" />
            {activeFilterCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-400 flex items-center justify-center">
                <span className="text-[9px] text-white font-bold">{activeFilterCount}</span>
              </div>
            )}
          </button>
        </div>

        {/* Summary row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                <ArrowUpRight size={12} className="text-white" />
              </div>
              <p className="text-[11px] text-white/80 font-semibold">Total Masuk</p>
            </div>
            <p className="text-sm font-extrabold text-white">{formatRupiah(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-rose-500 flex items-center justify-center">
                <ArrowDownRight size={12} className="text-white" />
              </div>
              <p className="text-[11px] text-white/80 font-semibold">Total Keluar</p>
            </div>
            <p className="text-sm font-extrabold text-white">{formatRupiah(totalExpense)}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-3">
        {/* Filter panel */}
        {showFilter && (
          <div className="mobile-card p-4 animate-scale-in">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-secondary)' }}>Filter</p>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Tipe Transaksi</p>
                <div className="flex gap-2 flex-wrap">
                  {[['', 'Semua'], ['expense', 'Pengeluaran'], ['income', 'Pemasukan']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setFilters({ ...filters, type: val })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold touch-feedback min-h-[36px] ${
                        filters.type === val
                          ? 'text-white'
                          : ''
                      }`}
                      style={filters.type === val
                        ? { background: 'var(--color-primary)' }
                        : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Tipe Saldo</p>
                <div className="flex gap-2 flex-wrap">
                  {[['', 'Semua'], ['personal', 'Pribadi'], ['office', 'Lainnya']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setFilters({ ...filters, balance_type: val })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold touch-feedback min-h-[36px] ${
                        filters.balance_type === val
                          ? 'text-white'
                          : ''
                      }`}
                      style={filters.balance_type === val
                        ? { background: 'var(--color-primary)' }
                        : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ type: '', payment_method: '', balance_type: '' })}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-expense)] font-bold touch-feedback py-2"
                >
                  <X size={12} /> Reset filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info bar */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? 'Memuat...' : `${transactions.length} transaksi`}
          </p>
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>{activeFilterCount} filter aktif</span>
          )}
        </div>

        {/* Transaction list */}
        <div className="mobile-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '80ms', opacity: 0 }} role="list" aria-label="Daftar transaksi">
          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--color-divider)' }}>
                  <div className="w-10 h-10 animate-shimmer rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 animate-shimmer rounded-lg" />
                    <div className="h-2.5 w-20 animate-shimmer rounded-lg" />
                  </div>
                  <div className="h-3.5 w-20 animate-shimmer rounded-lg" />
                </div>
              ))}
            </>
          ) : transactions.length > 0 ? (
            <>
              {transactions.map((tx) => (
                <SwipeableRow key={tx.id} onDelete={() => handleDelete(tx.id)}>
                  <div
                    className="flex items-center gap-3 px-4 py-3.5"
                    role="listitem"
                    style={{ borderBottom: '1px solid var(--color-divider)' }}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income' ? 'bg-[var(--color-income-soft)]' : 'bg-[var(--color-expense-soft)]'
                    }`}>
                      {tx.type === 'income'
                        ? <ArrowUpRight size={17} className="text-[var(--color-income)]" />
                        : <ArrowDownRight size={17} className="text-[var(--color-expense)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-card-title)' }}>{tx.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] truncate max-w-[80px]" style={{ color: 'var(--color-text-muted)' }}>
                          {tx.category_name || 'No Kategori'}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>·</span>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {PAYMENT_ICONS[tx.payment_method] || ''} {PAYMENT_METHOD_LABELS[tx.payment_method as PaymentMethod]}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>·</span>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{formatDate(tx.date)}</span>
                      </div>
                    </div>
                    <p className={`text-sm font-bold whitespace-nowrap ${
                      tx.type === 'income' ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </p>
                  </div>
                </SwipeableRow>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-3xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                <Receipt className="text-teal-300" size={26} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Belum ada transaksi</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Ketuk + untuk mulai mencatat</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowForm(true)} className="fab" aria-label="Tambah transaksi">
        <Plus size={22} />
      </button>

      {/* Full-page form overlay */}
      {showForm && (
        <div className="fullpage-overlay">
          <TransactionForm
            onSuccess={() => { setShowForm(false); fetchTransactions(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
