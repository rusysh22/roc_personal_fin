'use client';

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { getTransactions, deleteTransaction } from '@/lib/api';
import { prefetchCache } from '@/contexts/AuthContext';
import { Transaction, PAYMENT_METHOD_LABELS, BALANCE_TYPE_LABELS, PaymentMethod, BalanceType } from '@/types';

const TransactionForm = lazy(() =>
  import('@/components/transactions/TransactionForm').then(m => ({ default: m.TransactionForm }))
);
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  Plus, ArrowUpRight, ArrowDownRight, Receipt, SlidersHorizontal, X,
  Pencil, Calendar, CreditCard, Wallet, Tag, FileText, Building2, Trash2, Loader2,
  Search, LayoutGrid, CalendarRange, Banknote, ChevronDown
} from 'lucide-react';
import { useDialog } from '@/contexts/DialogContext';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';

// Module-level cache: categories are static, no need to re-fetch on every mount
let _cachedCategories: import('@/types').Category[] = [];

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵',
  bank_transfer: '🏦',
  credit_card: '💳',
  paylater: '⏰',
  e_wallet: '📱',
  cod: '📦',
};

// Payment methods that should show account name instead of generic label
const ACCOUNT_BASED_METHODS = ['bank_transfer', 'e_wallet', 'paylater'];

function getPaymentDisplay(tx: Transaction): string {
  // If this is an account-based method AND has an account name, show that instead
  if (ACCOUNT_BASED_METHODS.includes(tx.payment_method) && tx.finance_account_name) {
    return tx.finance_account_name;
  }
  return PAYMENT_METHOD_LABELS[tx.payment_method as PaymentMethod] || tx.payment_method;
}

export default function TransactionsPage() {
  const { showConfirm } = useDialog();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ 
    type: '', 
    payment_method: '', 
    balance_type: '',
    category: '',
    date_from: '',
    date_to: '',
    min_amount: '',
    max_amount: ''
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'category' | 'account'>('none');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (_cachedCategories.length > 0) {
      setCategories(_cachedCategories);
    } else {
      getCategories().then(res => {
        const data = res.data.results || res.data;
        _cachedCategories = data;
        setCategories(data);
      }).catch(console.error);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const isInitialMount = useCallback(() => {
    // No filters/search active = initial load, safe to use prefetch cache
    const f = filters;
    return !f.type && !f.payment_method && !f.balance_type && !f.category &&
      !f.date_from && !f.date_to && !f.min_amount && !f.max_amount && !debouncedSearch;
  }, [filters, debouncedSearch]);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.type) params.type = filters.type;
    if (filters.payment_method) params.payment_method = filters.payment_method;
    if (filters.balance_type) params.balance_type = filters.balance_type;
    if (filters.category) params.category = filters.category;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.min_amount) params.min_amount = filters.min_amount;
    if (filters.max_amount) params.max_amount = filters.max_amount;
    if (debouncedSearch) params.search = debouncedSearch;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promise: Promise<any> = (isInitialMount() && prefetchCache.transactions)
      ? prefetchCache.transactions
      : getTransactions(params);
    if (isInitialMount()) prefetchCache.transactions = undefined;

    promise
      .then((res) => { if (res) setTransactions(res.data?.results ?? res.data ?? []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, debouncedSearch, isInitialMount]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchTransactions();
  };

  const activeFilterCount = [
    filters.type, 
    filters.payment_method, 
    filters.balance_type, 
    filters.category,
    filters.date_from,
    filters.date_to,
    filters.min_amount,
    filters.max_amount
  ].filter(Boolean).length;
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0), [transactions]);

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

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
        {/* Search Bar */}
        <div className="relative z-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari deskripsi atau kategori..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--color-bg-card)] border-none shadow-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] transition-all placeholder:text-slate-400"
              style={{ color: 'var(--color-text-primary)' }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Group By Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 ml-1">Grup:</span>
          {(['none', 'date', 'category', 'account'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGroupBy(mode)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                groupBy === mode 
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                  : 'bg-[var(--color-bg-card)] text-slate-500 border-transparent'
              }`}
            >
              {mode === 'none' ? 'Biasa' : mode === 'date' ? 'Tanggal' : mode === 'category' ? 'Kategori' : 'Akun'}
            </button>
          ))}
        </div>
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

              <div>
                <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Kategori</p>
                <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto no-scrollbar py-1">
                  <button
                    onClick={() => setFilters({ ...filters, category: '' })}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold touch-feedback min-h-[36px] ${
                      !filters.category ? 'text-white' : ''
                    }`}
                    style={!filters.category
                      ? { background: 'var(--color-primary)' }
                      : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                    }
                  >
                    Semua
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFilters({ ...filters, category: String(cat.id) })}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold touch-feedback min-h-[36px] ${
                        filters.category === String(cat.id) ? 'text-white' : ''
                      }`}
                      style={filters.category === String(cat.id)
                        ? { background: 'var(--color-primary)' }
                        : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Dari Tanggal</p>
                  <input 
                    type="date" 
                    value={filters.date_from}
                    onChange={e => setFilters({ ...filters, date_from: e.target.value })}
                    className="mobile-input !py-2 !text-xs"
                  />
                </div>
                <div>
                  <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Sampai Tanggal</p>
                  <input 
                    type="date" 
                    value={filters.date_to}
                    onChange={e => setFilters({ ...filters, date_to: e.target.value })}
                    className="mobile-input !py-2 !text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Min Amount</p>
                  <input 
                    type="number" 
                    placeholder="Rp 0"
                    value={filters.min_amount}
                    onChange={e => setFilters({ ...filters, min_amount: e.target.value })}
                    className="mobile-input !py-2 !text-xs"
                  />
                </div>
                <div>
                  <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>Max Amount</p>
                  <input 
                    type="number" 
                    placeholder="Rp Max"
                    value={filters.max_amount}
                    onChange={e => setFilters({ ...filters, max_amount: e.target.value })}
                    className="mobile-input !py-2 !text-xs"
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ 
                    type: '', payment_method: '', balance_type: '',
                    category: '', date_from: '', date_to: '',
                    min_amount: '', max_amount: ''
                  })}
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
        <div className="animate-fade-in-up" style={{ animationDelay: '80ms', opacity: 0 }}>
          {loading ? (
            <div className="mobile-card overflow-hidden">
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
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(
                transactions.reduce((acc, tx) => {
                  let group = 'Semua';
                  if (groupBy === 'date') group = formatDate(tx.date);
                  else if (groupBy === 'category') group = tx.category_name || 'Tanpa Kategori';
                  else if (groupBy === 'account') group = tx.finance_account_name || 'Cash / Tanpa Akun';
                  
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(tx);
                  return acc;
                }, {} as Record<string, Transaction[]>)
              ).map(([group, groupTxs]) => (
                <div key={group} className="space-y-2">
                  {groupBy !== 'none' && (
                    <div className="flex items-center gap-2 px-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{group}</h4>
                      <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                      <span className="text-[10px] font-bold text-slate-400">{groupTxs.length} items</span>
                    </div>
                  )}
                  <div className="mobile-card overflow-hidden">
                    {groupTxs.map((tx) => (
                      <SwipeableRow key={tx.id} onDelete={() => handleDelete(tx.id)}>
                        <div
                          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-black/[0.03] dark:active:bg-white/[0.03] transition-colors"
                          role="listitem"
                          style={{ borderBottom: '1px solid var(--color-divider)' }}
                          onClick={() => setDetailTransaction(tx)}
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
                                {PAYMENT_ICONS[tx.payment_method] || ''} {getPaymentDisplay(tx)}
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mobile-card py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-3xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                <Receipt className="text-teal-300" size={26} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Belum ada transaksi</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Ketuk + untuk mulai mencatat atau ubah filter Anda</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className="fab" aria-label="Tambah transaksi">
        <Plus size={22} />
      </button>

      {/* Full-page form overlay — lazy loaded */}
      {showForm && (
        <div className="fullpage-overlay">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /></div>}>
            <TransactionForm
              transaction={editingTransaction}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </Suspense>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!detailTransaction}
        onClose={() => setDetailTransaction(null)}
        title="Detail Transaksi"
      >
        {detailTransaction && (
          <TransactionDetail
            transaction={detailTransaction}
            onEdit={() => {
              const tx = detailTransaction;
              setDetailTransaction(null);
              handleEdit(tx);
            }}
            onDelete={async () => {
              const confirmed = await showConfirm('Hapus Transaksi?', {
                message: 'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
                confirmText: 'Ya, Hapus',
                variant: 'error'
              });
              if (confirmed) {
                const id = detailTransaction.id;
                setDetailTransaction(null);
                await handleDelete(id);
              }
            }}
            isDeleting={deletingId === detailTransaction.id}
          />
        )}
      </Modal>
    </div>
  );
}

function TransactionDetail({ 
  transaction: tx, 
  onEdit, 
  onDelete,
  isDeleting 
}: { 
  transaction: Transaction; 
  onEdit: () => void; 
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isIncome = tx.type === 'income';

  return (
    <div className="space-y-4">
      {/* Amount highlight */}
      <div
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{
          background: isIncome ? 'var(--color-income-soft)' : 'var(--color-expense-soft)',
        }}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          isIncome ? 'bg-[var(--color-income)]' : 'bg-[var(--color-expense)]'
        }`}>
          {isIncome
            ? <ArrowUpRight size={22} className="text-white" />
            : <ArrowDownRight size={22} className="text-white" />}
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </p>
          <p className={`text-xl font-extrabold ${
            isIncome ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
          }`}>
            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
          </p>
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-0.5">
        <DetailRow
          icon={<FileText size={15} />}
          label="Deskripsi"
          value={tx.description}
        />
        <DetailRow
          icon={<Tag size={15} />}
          label="Kategori"
          value={tx.category_name || 'Tidak ada kategori'}
        />
        <DetailRow
          icon={<CreditCard size={15} />}
          label="Metode Pembayaran"
          value={`${PAYMENT_ICONS[tx.payment_method] || ''} ${PAYMENT_METHOD_LABELS[tx.payment_method as PaymentMethod] || tx.payment_method}`}
        />
        {tx.finance_account_name && (
          <DetailRow
            icon={<Building2 size={15} />}
            label="Akun"
            value={tx.finance_account_name}
          />
        )}
        <DetailRow
          icon={<Wallet size={15} />}
          label="Tipe Saldo"
          value={tx.balance_type === 'personal' ? '👤 Pribadi' : '🏢 ' + (BALANCE_TYPE_LABELS[tx.balance_type as BalanceType] || tx.balance_type)}
        />
        <DetailRow
          icon={<Calendar size={15} />}
          label="Tanggal"
          value={formatDate(tx.date)}
        />
      </div>

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onEdit}
          disabled={isDeleting}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
            boxShadow: '0 6px 20px rgba(13, 148, 136, 0.3)',
          }}
        >
          <Pencil size={15} />
          Edit Transaksi
        </button>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'var(--color-bg-app)',
            border: '1px solid #fee2e2',
            color: '#ef4444',
          }}
        >
          {isDeleting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Hapus Transaksi
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--color-divider)' }}>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--color-filter-bg)', color: 'var(--color-text-muted)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}
