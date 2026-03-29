'use client';

import { useState, useEffect } from 'react';
import { Category, PaymentMethod, BALANCE_TYPE_LABELS, BalanceType, FinanceAccount, Transaction } from '@/types';
import { getCategories, createTransaction, updateTransaction, getFinanceAccounts } from '@/lib/api';
import { Loader2, Delete, AlignLeft, Calendar, X, Check } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  transaction?: Transaction | null;
}

// Category icon mapping by name keywords
function getCategoryEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('makan') || n.includes('food') || n.includes('restoran')) return '🍽️';
  if (n.includes('kopi') || n.includes('coffee') || n.includes('cafe')) return '☕';
  if (n.includes('belanja') || n.includes('shopping')) return '🛍️';
  if (n.includes('groceries') || n.includes('supermarket') || n.includes('pasar')) return '🛒';
  if (n.includes('transport') || n.includes('ojek') || n.includes('taksi') || n.includes('grab') || n.includes('gojek')) return '🚗';
  if (n.includes('bensin') || n.includes('bbm') || n.includes('solar') || n.includes('bahan bakar')) return '⛽';
  if (n.includes('tagihan') || n.includes('bill') || n.includes('listrik') || n.includes('air') || n.includes('pln')) return '💡';
  if (n.includes('internet') || n.includes('wifi')) return '📶';
  if (n.includes('pulsa') || n.includes('paket')) return '📱';
  if (n.includes('kesehatan') || n.includes('dokter') || n.includes('obat') || n.includes('rs')) return '🏥';
  if (n.includes('pendidikan') || n.includes('sekolah') || n.includes('kuliah') || n.includes('kursus')) return '🎓';
  if (n.includes('hiburan') || n.includes('nonton') || n.includes('game') || n.includes('bioskop')) return '🎬';
  if (n.includes('gaji') || n.includes('salary') || n.includes('upah')) return '💰';
  if (n.includes('investasi') || n.includes('invest') || n.includes('saham')) return '📈';
  if (n.includes('bonus') || n.includes('thr')) return '🎁';
  if (n.includes('freelance') || n.includes('side')) return '💼';
  if (n.includes('tabungan') || n.includes('saving')) return '🐷';
  if (n.includes('rent') || n.includes('kos') || n.includes('sewa')) return '🏠';
  if (n.includes('fashion') || n.includes('baju') || n.includes('pakaian')) return '👕';
  if (n.includes('olahraga') || n.includes('gym') || n.includes('sport')) return '💪';
  return '📂';
}

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'bank_transfer', label: 'Transfer', emoji: '🏦' },
  { value: 'credit_card', label: 'Kartu Kredit', emoji: '💳' },
  { value: 'e_wallet', label: 'E-Wallet', emoji: '📱' },
  { value: 'paylater', label: 'Paylater', emoji: '⏰' },
  { value: 'cod', label: 'COD', emoji: '📦' },
];

export function TransactionForm({ onSuccess, onCancel, transaction }: TransactionFormProps) {
  const isEditing = !!transaction;
  const { showAlert } = useDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [amountStr, setAmountStr] = useState(transaction ? String(Math.round(parseFloat(transaction.amount))) : '');
  const [type, setType] = useState<'expense' | 'income'>(transaction?.type || 'expense');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(transaction?.category || null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(transaction?.finance_account || null);
  const [description, setDescription] = useState(transaction?.description || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>((transaction?.payment_method as PaymentMethod) || 'cash');
  const [balanceType, setBalanceType] = useState<BalanceType>(transaction?.balance_type || 'personal');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);

  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  useEffect(() => {
    getCategories(type).then((res) => {
      setCategories(res.data.results || res.data);
      // Don't reset category on initial load when editing
      if (!hasLoadedInitial && isEditing) {
        setHasLoadedInitial(true);
      } else {
        setSelectedCategory(null);
        setHasLoadedInitial(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    getFinanceAccounts({ is_active: 'true' }).then(res => {
      const data = res.data;
      if (data && Array.isArray(data.results)) setAccounts(data.results);
      else if (Array.isArray(data)) setAccounts(data);
    }).catch(() => {});
  }, []);

  // Numpad handler
  const handleNumpad = (key: string) => {
    if (key === 'del') {
      setAmountStr((prev) => prev.slice(0, -1));
    } else if (key === '000') {
      setAmountStr((prev) => (prev === '' ? '' : prev + '000'));
    } else {
      if (amountStr.length >= 12) return;
      setAmountStr((prev) => prev + key);
    }
  };

  const amountNumber = parseInt(amountStr || '0', 10);

  const handleSubmit = async () => {
    if (!amountNumber || amountNumber <= 0) {
      showAlert('Masukkan jumlah yang valid', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        type,
        category: selectedCategory,
        finance_account: selectedAccountId,
        amount: String(amountNumber),
        description: description || (categories.find(c => c.id === selectedCategory)?.name || 'Transaksi'),
        payment_method: paymentMethod,
        balance_type: balanceType,
        date,
      };
      if (isEditing) {
        await updateTransaction(transaction.id, payload);
      } else {
        await createTransaction(payload);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan transaksi', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const typeGradient = type === 'expense'
    ? 'linear-gradient(135deg, #f43f5e, #e11d48)' // rose-500 to rose-600
    : 'linear-gradient(135deg, #10b981, #059669)'; // emerald-500 to emerald-600

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg-app)' }}>
      {/* Top bar */}
      <div style={{ background: typeGradient, paddingTop: 'calc(12px + var(--sat))' }} className="px-4 pb-5 shrink-0">
        {/* Type tabs */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <X size={16} className="text-white" />
          </button>
          <div className="flex gap-1 p-1 bg-white/20 backdrop-blur-sm rounded-2xl">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  type === t ? 'bg-white shadow-sm' : 'text-white/80 hover:text-white'
                }`}
                style={type === t ? { color: t === 'expense' ? 'var(--color-expense)' : 'var(--color-income)' } : {}}
              >
                {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </button>
            ))}
          </div>
          <div className="w-8" />
        </div>

        {/* Amount display */}
        <div className="text-center">
          <p className="text-4xl font-bold text-white tracking-tight">
            {amountNumber > 0 ? formatRupiah(String(amountNumber)) : 'Rp 0'}
          </p>
        </div>
      </div>

      {/* Scrollable middle section */}
      <div className="flex-1 overflow-y-auto">
        {/* Category grid */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-section-label)' }}>Kategori</p>
          {categories.length > 0 ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))' }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all ${
                    selectedCategory === cat.id
                      ? 'ring-2 shadow-md scale-[1.04]'
                      : 'active:scale-95'
                  }`}
                  style={selectedCategory === cat.id ? {
                    backgroundColor: cat.color + '15',
                    borderColor: cat.color,
                    border: `2px solid ${cat.color}`,
                    boxShadow: `0 2px 8px ${cat.color}30`,
                  } : { background: 'var(--color-bg-card)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: (selectedCategory === cat.id ? cat.color : 'var(--color-filter-bg)') }}
                  >
                    <span style={{ filter: selectedCategory === cat.id ? 'brightness(10)' : 'none' }}>
                      {getCategoryEmoji(cat.name)}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color: selectedCategory === cat.id ? cat.color : 'var(--color-text-secondary)' }}
                  >
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>Tidak ada kategori</p>
          )}
        </div>

        {/* Payment method */}
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-section-label)' }}>Metode Pembayaran</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPaymentMethod(opt.value as PaymentMethod)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  paymentMethod === opt.value
                    ? 'text-white shadow-sm'
                    : ''
                }`}
                style={paymentMethod === opt.value
                  ? { background: typeGradient }
                  : { background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }
                }
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Finance Account */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-border-card)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-section-label)' }}>Master Akun / Bank</p>
          {accounts.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedAccountId(null)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  selectedAccountId === null ? 'text-white shadow-sm' : ''
                }`}
                style={selectedAccountId === null
                  ? { background: typeGradient }
                  : { background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-card)' }
                }
              >
                Tanpa Akun
              </button>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    selectedAccountId === acc.id ? 'text-white shadow-sm' : ''
                  }`}
                  style={selectedAccountId === acc.id
                    ? { background: typeGradient }
                    : { background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-card)' }
                  }
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: acc.color }} />
                  {acc.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum ada master akun dibikin. Kamu bisa tambahkan di menu Settings {'>'} Master Akun.</p>
          )}
        </div>

        {/* Balance type */}
        <div className="px-4 pb-3 border-t pt-3" style={{ borderColor: 'var(--color-border-card)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-section-label)' }}>Tipe Saldo</p>
          <div className="flex gap-2">
            {Object.entries(BALANCE_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setBalanceType(key as BalanceType)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  balanceType === key
                    ? 'text-white shadow-sm'
                    : ''
                }`}
                style={balanceType === key
                  ? { background: typeGradient }
                  : { background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-card)' }
                }
              >
                {key === 'personal' ? '👤' : '🏢'} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes + Date */}
        <div className="px-4 pb-3 flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
            <AlignLeft size={14} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan (opsional)"
              className="flex-1 text-xs outline-none bg-transparent"
              style={{ color: 'var(--color-text-secondary)' }}
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
            <Calendar size={14} className="shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs outline-none bg-transparent w-24"
              style={{ color: 'var(--color-text-secondary)' }}
            />
          </div>
        </div>
      </div>

      {/* Numpad */}
      <div className="shrink-0 px-3 pt-3" style={{ background: 'var(--color-numpad-bg)', borderTop: '1px solid var(--color-numpad-border)', paddingBottom: 'calc(8px + var(--sab))' }}>
        <div className="grid grid-cols-3 gap-1.5">
          {['1','2','3','4','5','6','7','8','9','000','0','del'].map((key) => (
            <button
              key={key}
              onClick={() => handleNumpad(key)}
              className="h-12 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all active:scale-95"
              style={{
                background: key === 'del' ? 'var(--color-numpad-key-del)' : 'var(--color-numpad-key)',
                color: 'var(--color-numpad-text)',
              }}
            >
              {key === 'del' ? <Delete size={18} style={{ color: 'var(--color-text-secondary)' }} /> : key}
            </button>
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={handleSubmit}
          disabled={loading || amountNumber <= 0}
          className="w-full mt-3 py-3.5 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
          style={{ background: typeGradient }}
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
            : <><Check size={18} /> {isEditing ? 'Perbarui' : 'Simpan'}</>}
        </button>
      </div>
    </div>
  );
}
