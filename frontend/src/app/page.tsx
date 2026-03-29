'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboard, getCompanies } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardData, Company } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { TrendingDown, Wallet, Building2, User, ArrowUpRight, ArrowDownRight, ChevronRight, Plus, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Modal } from '@/components/ui/Modal';

const COLORS = ['#0d9488', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#2dd4bf', '#fb7185', '#14b8a6'];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const fetchDash = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const savedId = localStorage.getItem('activeCompanyId') || '';
    setActiveCompanyId(savedId);

    Promise.all([
      getDashboard(),
      getCompanies()
    ])
      .then(([resDash, resComp]) => {
        setData(resDash.data);
        setCompanies(resComp.data.results || resComp.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCompanyChange = async (newId: string) => {
    if (newId) localStorage.setItem('activeCompanyId', newId);
    else localStorage.removeItem('activeCompanyId');

    setActiveCompanyId(newId);
    setLoading(true);
    await fetchDash();
    setLoading(false);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header" style={{ paddingBottom: '48px' }}>
          <div className="h-4 w-24 animate-shimmer rounded-lg mb-2" />
          <div className="h-8 w-40 animate-shimmer rounded-lg" />
        </div>
        <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
          <div className="h-24 animate-shimmer rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 animate-shimmer rounded-2xl" />)}
          </div>
          <div className="h-48 animate-shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <TrendingDown className="text-red-400" size={28} />
        </div>
        <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>Gagal memuat data. Pastikan backend berjalan di localhost:8000.</p>
      </div>
    );
  }

  const pieData = data.spending_by_category.map((item, idx) => ({
    name: item.category__name || 'Tanpa Kategori',
    value: parseFloat(item.total),
    color: item.category__color || COLORS[idx % COLORS.length],
  }));

  const monthMap = new Map<string, { month: string; income: number; expense: number }>();
  data.monthly_trend.forEach((item) => {
    const key = item.month.slice(0, 7);
    if (!monthMap.has(key)) monthMap.set(key, { month: key, income: 0, expense: 0 });
    const entry = monthMap.get(key)!;
    if (item.type === 'income') entry.income += parseFloat(item.total);
    else entry.expense += parseFloat(item.total);
  });
  const areaData = Array.from(monthMap.values()).slice(-6);
  const totalPieValue = pieData.reduce((sum, d) => sum + d.value, 0);

  const now = new Date();
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="pb-2">
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center justify-between mb-3 relative z-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white uppercase overflow-hidden shrink-0">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.first_name ? user.first_name.charAt(0) : user?.username?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Selamat datang</p>
              <h1 className="text-sm font-bold text-white truncate max-w-[140px]">{user?.first_name || user?.username || 'User'}</h1>
            </div>
          </div>

          <div className="max-w-[180px]">
            <label className="sr-only">Pilih Ruang Kerja</label>
            <SearchableSelect
              options={[
                { value: '', label: 'Personal', icon: '👤' },
                ...companies.map(c => ({ value: String(c.id), label: c.name, icon: '🏢' })),
              ]}
              value={activeCompanyId}
              onChange={handleCompanyChange}
              placeholder="Personal"
              searchPlaceholder="Cari perusahaan..."
              className="!bg-white/15 !backdrop-blur-md !border-white/20 !text-white !text-xs !py-2 !rounded-2xl"
            />
          </div>
        </div>

        <p className="text-xs text-white/60 mb-1">{monthName}</p>
        <p className="text-balance-amount text-white">{formatRupiah(data.balance)}</p>
        <p className="text-xs text-white/70 mt-1">Total Saldo</p>

        {/* Income/Expense row */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                <ArrowUpRight size={14} className="text-white" />
              </div>
              <span className="text-[11px] text-white font-semibold">Pemasukan</span>
            </div>
            <p className="text-sm font-extrabold text-white">{formatRupiah(data.total_income)}</p>
          </div>
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center shadow-[0_4px_12px_rgba(244,63,94,0.3)]">
                <ArrowDownRight size={14} className="text-white" />
              </div>
              <span className="text-[11px] text-white font-semibold">Pengeluaran</span>
            </div>
            <p className="text-sm font-extrabold text-white">{formatRupiah(data.total_expense)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-4">
        {/* Saldo cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
          <button onClick={() => setShowAccounts(true)} className="mobile-card p-4 touch-feedback text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <User size={15} className="text-blue-500" />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Saldo Pribadi</span>
            </div>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-card-title)' }}>{formatRupiah(data.personal_balance)}</p>
          </button>
          <button onClick={() => setShowAccounts(true)} className="mobile-card p-4 touch-feedback text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Building2 size={15} className="text-amber-500" />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Saldo Lainnya</span>
            </div>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-card-title)' }}>{formatRupiah(data.office_balance)}</p>
          </button>
        </div>

        {/* Trend chart */}
        <div className="mobile-card p-4 animate-fade-in-up" style={{ animationDelay: '80ms', opacity: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-section-title" style={{ color: 'var(--color-text-card-title)' }}>Tren Bulanan</h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>6 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Masuk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Keluar</span>
              </div>
            </div>
          </div>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <Tooltip
                  formatter={(value) => formatRupiah(Number(value))}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#34d399" strokeWidth={2} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#fb7185" strokeWidth={2} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-36">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada data</p>
            </div>
          )}
        </div>

        {/* Spending by Category */}
        {pieData.length > 0 && (
          <div className="mobile-card p-4 animate-fade-in-up" style={{ animationDelay: '160ms', opacity: 0 }}>
            <h3 className="text-section-title mb-3" style={{ color: 'var(--color-text-card-title)' }}>Pengeluaran per Kategori</h3>
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <PieChart width={110} height={110}>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} strokeWidth={0}>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text-secondary)' }}>{item.name}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      {totalPieValue > 0 ? Math.round(item.value / totalPieValue * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="mobile-card animate-fade-in-up" style={{ animationDelay: '240ms', opacity: 0 }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h3 className="text-section-title" style={{ color: 'var(--color-text-card-title)' }}>Transaksi Terakhir</h3>
            <Link href="/transactions" className="flex items-center gap-1 text-[11px] font-semibold touch-feedback py-1" style={{ color: 'var(--color-primary)' }}>
              Lihat semua <ChevronRight size={13} />
            </Link>
          </div>
          {data.recent_transactions.length > 0 ? (
            <div role="list">
              {data.recent_transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3" role="listitem" style={{ borderTop: '1px solid var(--color-divider)' }}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-[var(--color-income-soft)]' : 'bg-[var(--color-expense-soft)]'
                    }`}>
                    {tx.type === 'income'
                      ? <ArrowUpRight size={17} className="text-[var(--color-income)]" />
                      : <ArrowDownRight size={17} className="text-[var(--color-expense)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-card-title)' }}>{tx.description}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{tx.category_name || 'Tanpa Kategori'} &middot; {formatDate(tx.date)}</p>
                  </div>
                  <p className={`text-sm font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-[var(--color-income)]' : 'text-[var(--color-expense)]'
                    }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
              <Wallet size={28} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum ada transaksi</p>
            </div>
          )}
        </div>
      </div>

      {/* Rincian Akun Modal */}
      <Modal isOpen={showAccounts} onClose={() => setShowAccounts(false)} title="Rincian Saldo Akun / Bank">
        <div className="space-y-3">
          {data.accounts && data.accounts.length > 0 ? (
            data.accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--color-border-card)', background: 'var(--color-bg-card)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: acc.color || '#3b82f6' }}>
                    <Wallet size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--color-text-card-title)' }}>{acc.name}</h4>
                    <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      {acc.type === 'bank' ? 'Bank' : acc.type === 'cash' ? 'Tunai' : acc.type === 'e_wallet' ? 'E-Wallet' : 'Lainnya'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatRupiah(acc.current_balance)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Wallet size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-semibold">Belum ada Master Akun / Bank</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan di menu Profil &gt; Kelola Master Akun / Bank</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Full-page form overlay identical to the transactions page */}
      {showForm && (
        <div className="fullpage-overlay">
          <TransactionForm
            onSuccess={() => {
              setShowForm(false);
              setLoading(true);
              getDashboard().then(res => setData(res.data)).finally(() => setLoading(false));
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Floating Action Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fab"
          aria-label="Tambah Transaksi Baru"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
