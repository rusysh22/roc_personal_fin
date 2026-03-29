'use client';

import { useEffect, useState, useCallback } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget, getCategories, getPlans, createPlan, updatePlan, deletePlan, patchPlan, getPlanCategories, getPlanSubCategories, createPlanCategory, createPlanSubCategory } from '@/lib/api';
import { Budget, Category, Plan, PlanCategory, PlanSubCategory } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { formatRupiah } from '@/lib/utils';
import { Plus, Trash2, PiggyBank, AlertTriangle, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Target, Edit3, Briefcase, CalendarClock, ListTodo, PlusCircle } from 'lucide-react';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { useDialog } from '@/contexts/DialogContext';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function BudgetsPage() {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'budget' | 'plan'>('budget');
  
  // Budget State
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState<{ id?: number; category: string; amount: string }>({ category: '', amount: '' });
  
  // Plan State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState<{
    id?: number;
    category: string;
    sub_category: string;
    item_name: string;
    amount: string;
    description: string;
    target_date: string;
  }>({ category: '', sub_category: '', item_name: '', amount: '', description: '', target_date: new Date().toISOString().split('T')[0] });
  
  // Plan Master Data
  const [planCategories, setPlanCategories] = useState<PlanCategory[]>([]);
  const [planSubCategories, setPlanSubCategories] = useState<PlanSubCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlanMasterData = async () => {
    try {
      const [catRes, subRes] = await Promise.all([getPlanCategories(), getPlanSubCategories()]);
      setPlanCategories(catRes.data.results || catRes.data);
      setPlanSubCategories(subRes.data.results || subRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'budget') {
        const res = await getBudgets({ month, year });
        setBudgets(res.data.results || res.data);
      } else {
        const res = await getPlans();
        setPlans(res.data.results || res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, activeTab]);

  useEffect(() => {
    fetchData();
    if (categories.length === 0) {
      getCategories('expense').then((res) => setCategories(res.data.results || res.data));
    }
    fetchPlanMasterData();
  }, [fetchData]);

  // ===== Budget Handlers =====
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (budgetForm.id) {
        await updateBudget(budgetForm.id, { category: parseInt(budgetForm.category), amount: budgetForm.amount, month, year });
      } else {
        await createBudget({ category: parseInt(budgetForm.category), amount: budgetForm.amount, month, year });
      }
      setShowBudgetForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan budget', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    const confirmed = await showConfirm('Hapus Budget?', { message: 'Yakin ingin menghapus budget ini?' });
    if (!confirmed) return;
    try { await deleteBudget(id); fetchData(); } catch (err) { console.error(err); }
  };

  const openEditBudget = (b: Budget) => {
    setBudgetForm({ id: b.id, category: String(b.category), amount: String(parseFloat(b.amount)) });
    setShowBudgetForm(true);
  };
  
  const openNewBudget = () => {
    setBudgetForm({ category: '', amount: '' });
    setShowBudgetForm(true);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        item_name: planForm.item_name,
        amount: planForm.amount,
        description: planForm.description,
        target_date: planForm.target_date,
      };
      if (planForm.category) payload.category = parseInt(planForm.category);
      if (planForm.sub_category) payload.sub_category = parseInt(planForm.sub_category);

      if (planForm.id) {
        await updatePlan(planForm.id, payload);
      } else {
        await createPlan(payload);
      }
      setShowPlanForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan planner', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlanCategory = async () => {
    const name = await showPrompt('Kategori Utama Baru', { message: 'Masukkan nama Kategori Utama baru', placeholder: 'Misal: Wedding' });
    if (!name) return;
    try {
      const res = await createPlanCategory({ name });
      setPlanCategories([...planCategories, res.data]);
      setPlanForm({ ...planForm, category: String(res.data.id), sub_category: '' });
    } catch (err) {
      console.error(err);
      showAlert('Gagal menambahkan kategori', { variant: 'error' });
    }
  };

  const handleCreatePlanSubCategory = async () => {
    if (!planForm.category) {
      showAlert('Pilih Kategori Utama terlebih dahulu!', { variant: 'warning' });
      return;
    }
    const name = await showPrompt('Sub Kategori Baru', { message: 'Masukkan nama Sub Kategori baru', placeholder: 'Misal: Dekorasi' });
    if (!name) return;
    try {
      const res = await createPlanSubCategory({ category: parseInt(planForm.category), name });
      setPlanSubCategories([...planSubCategories, res.data]);
      setPlanForm({ ...planForm, sub_category: String(res.data.id) });
    } catch (err) {
      console.error(err);
      showAlert('Gagal menambahkan sub kategori', { variant: 'error' });
    }
  };

  const handleTogglePlanTarget = async (id: number, currentStatus: boolean) => {
    try {
      await patchPlan(id, { is_realized: !currentStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (id: number) => {
    const confirmed = await showConfirm('Hapus Plan?', { message: 'Yakin ingin menghapus plan item ini?' });
    if (!confirmed) return;
    try { await deletePlan(id); fetchData(); } catch (err) { console.error(err); }
  };
  
  const openEditPlan = (p: Plan) => {
    setPlanForm({
      id: p.id,
      category: p.category ? String(p.category) : '',
      sub_category: p.sub_category ? String(p.sub_category) : '',
      item_name: p.item_name,
      amount: String(parseFloat(p.amount)),
      description: p.description,
      target_date: p.target_date,
    });
    setShowPlanForm(true);
  };

  const openNewPlan = () => {
    setPlanForm({ category: '', sub_category: '', item_name: '', amount: '', description: '', target_date: new Date().toISOString().split('T')[0] });
    setShowPlanForm(true);
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  // Budget calcs
  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent), 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudgetCount = budgets.filter(b => b.percentage > 100).length;

  // Plan calcs
  const totalPlanAmount = plans.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const realizedPlanAmount = plans.filter(p => p.is_realized).reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const uniquePlanCats = Array.from(new Set(plans.map(p => p.category_name || null)));

  return (
    <div className="pb-2">
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '70px' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Keuangan</p>
            <h1 className="text-xl font-bold text-white">Plan & Budget</h1>
          </div>
          {activeTab === 'budget' && overBudgetCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 rounded-xl shadow-lg shadow-rose-500/20 border border-white/20">
              <AlertTriangle size={13} className="text-white" />
              <span className="text-xs text-white font-bold">{overBudgetCount} berlebihan</span>
            </div>
          )}
          {activeTab === 'plan' && plans.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 border border-white/20">
              <CheckCircle2 size={13} className="text-white" />
              <span className="text-xs text-white font-bold">{plans.filter(p=>p.is_realized).length}/{plans.length} Tercapai</span>
            </div>
          )}
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-white/10 backdrop-blur-md rounded-2xl mb-1 mt-2">
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'budget' ? 'bg-white text-[var(--color-primary-dark)] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <PiggyBank size={15} /> Budget Bulanan
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'plan' ? 'bg-white text-[var(--color-primary-dark)] shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target size={15} /> Management Planner
          </button>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-12 space-y-4">
        
        {/* ==================== BUDGET TAB ==================== */}
        {activeTab === 'budget' && (
          <div className="animate-slide-up">
            {/* Month navigator */}
            <div className="flex items-center justify-between bg-[var(--color-bg-card)] rounded-2xl p-2.5 border border-[var(--color-border-card)] shadow-xs mb-4">
              <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center touch-feedback">
                <ChevronLeft size={20} className="text-slate-500" />
              </button>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text-card-title)' }}>{monthLabel}</span>
              <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center touch-feedback">
                <ChevronRight size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Total budget summary */}
            <div className="mobile-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Total Budget Terpakai</span>
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-card-title)' }}>
                  {formatRupiah(totalSpent)} <span style={{ color: 'var(--color-text-muted)' }} className="font-normal">/ {formatRupiah(totalBudget)}</span>
                </span>
              </div>
              <div className="w-full rounded-full h-2.5 overflow-hidden mb-1.5" style={{ background: 'var(--color-filter-bg)' }}>
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    totalPct > 100 ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                    totalPct > 80 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                    'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(totalPct, 100)}%` }}
                />
              </div>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{totalPct.toFixed(1)}% terpakai</p>
            </div>

            {/* Budget list */}
            {loading ? (
              <div className="space-y-3 mt-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-shimmer rounded-2xl" />)}
              </div>
            ) : budgets.length > 0 ? (
              <div className="space-y-4 mt-4">
                {budgets.map((budget) => {
                  const pct = budget.percentage;
                  const isOver = pct > 100;
                  const isWarning = pct > 80 && pct <= 100;
                  const barGradient = isOver ? 'from-red-400 to-rose-500' : isWarning ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500';
                  
                  const dPct = budget.daily_percentage || 0;
                  const isDOver = dPct > 100;
                  const isDWarning = dPct > 80 && dPct <= 100;
                  const dBarGradient = isDOver ? 'from-rose-400 to-red-500' : isDWarning ? 'from-orange-400 to-amber-500' : 'from-teal-400 to-emerald-500';

                  return (
                    <div key={budget.id} className="mobile-card p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${barGradient} flex items-center justify-center shadow-sm`}>
                            {isOver || isWarning
                              ? <AlertTriangle size={15} className="text-white" />
                              : <CheckCircle2 size={15} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--color-text-card-title)' }}>{budget.category_name}</p>
                          </div>
                        </div>
                        <button onClick={() => openEditBudget(budget)} className="p-1.5 rounded-lg touch-feedback bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <Edit3 size={14} />
                        </button>
                      </div>

                      {/* Monthly Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plafon Bulanan</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5 overflow-hidden mb-1.5" style={{ background: 'var(--color-filter-bg)' }}>
                          <div className={`h-1.5 rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <p className="text-[11px] font-medium flex justify-between">
                          <span style={{ color: 'var(--color-text-primary)' }}>{formatRupiah(budget.spent)}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>/ {formatRupiah(budget.amount)}</span>
                        </p>
                      </div>

                      {/* Daily Progress */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Harian</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{dPct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5 overflow-hidden mb-1.5" style={{ background: 'var(--color-filter-bg)' }}>
                          <div className={`h-1.5 rounded-full bg-gradient-to-r ${dBarGradient} transition-all duration-700`} style={{ width: `${Math.min(dPct, 100)}%` }} />
                        </div>
                        <p className="text-[11px] font-medium flex justify-between">
                          <span style={{ color: 'var(--color-text-primary)' }}>{formatRupiah(budget.daily_spent || '0')}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>/ {formatRupiah(budget.daily_limit || '0')}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mobile-card p-8 flex flex-col items-center gap-3 mt-4">
                <div className="w-14 h-14 rounded-3xl bg-teal-50 flex items-center justify-center">
                  <PiggyBank className="text-teal-300" size={26} />
                </div>
                <p className="text-sm font-medium text-slate-500">Belum ada budget bulan ini</p>
              </div>
            )}
          </div>
        )}


        {/* ==================== PLANNER TAB ==================== */}
        {activeTab === 'plan' && (
          <div className="animate-slide-up">
            {/* Summary */}
            <div className="mobile-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Realisasi Planner</span>
                <span className="text-xs font-bold text-[var(--color-income)]">
                  {formatRupiah(realizedPlanAmount)} <span style={{ color: 'var(--color-text-muted)' }} className="font-normal">/ {formatRupiah(totalPlanAmount)}</span>
                </span>
              </div>
            </div>

            {loading ? (
              <SectionLoading height="250px" />
            ) : plans.length > 0 ? (
              <div className="space-y-5">
                {uniquePlanCats.map((cat, idx) => {
                  const catPlans = plans.filter(p => p.category_name === cat || (p.category_name == null && cat == null));
                  const subCats = Array.from(new Set(catPlans.map(p => p.sub_category_name || null)));
                  
                  return (
                    <div key={cat || `null-${idx}`} className="space-y-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-section-label)' }}>
                        <Briefcase size={14} /> {cat || 'Tanpa Kategori Utama'}
                      </h2>
                      
                      {subCats.map((subCat, sIdx) => {
                        const items = catPlans.filter(p => p.sub_category_name === subCat || (p.sub_category_name == null && subCat == null));
                        return (
                          <div key={subCat || `null-${sIdx}`} className="mobile-card overflow-hidden">
                            {subCat && (
                              <div className="px-4 py-2.5 bg-black/5 flex items-center gap-2 border-b" style={{ borderColor: 'var(--color-border-card)' }}>
                                <ListTodo size={14} className="text-slate-500" />
                                <h3 className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>{subCat}</h3>
                              </div>
                            )}
                            <div className="divide-y" style={{ borderColor: 'var(--color-divider)' }}>
                              {items.map(p => (
                                <div key={p.id} className={`p-4 transition-colors ${p.is_realized ? 'bg-emerald-50/50' : ''}`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <button 
                                          onClick={() => handleTogglePlanTarget(p.id, p.is_realized)}
                                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${p.is_realized ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-slate-300'}`}
                                        >
                                          {p.is_realized && <CheckCircle2 size={12} className="text-white" />}
                                        </button>
                                        <p className={`text-sm font-bold ${p.is_realized ? 'text-slate-400 line-through' : ''}`} style={{ color: p.is_realized ? undefined : 'var(--color-text-card-title)' }}>
                                          {p.item_name}
                                        </p>
                                      </div>
                                      <p className="text-[11px] mb-2 leading-relaxed ml-7" style={{ color: 'var(--color-text-muted)' }}>{p.description}</p>
                                      <div className="flex items-center gap-3 ml-7">
                                        <p className="text-sm font-bold text-[var(--color-primary)]">{formatRupiah(p.amount)}</p>
                                        <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                                          <CalendarClock size={12} /> {new Date(p.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})}
                                        </p>
                                      </div>
                                    </div>
                                    <button onClick={() => openEditPlan(p)} className="p-2 bg-slate-100 rounded-xl touch-feedback text-slate-500">
                                      <Edit3 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mobile-card p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center">
                  <Target className="text-indigo-400" size={26} />
                </div>
                <p className="text-sm font-medium text-slate-500">Belum ada Planning Manajemen</p>
                <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Buat plan masa depanmu sekarang juga!</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* GLOBAL FAB FOR BUDGETS & PLANS */}
      <button 
        onClick={activeTab === 'budget' ? openNewBudget : openNewPlan} 
        className="fab z-50"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* ================= MODALS ================= */}

      {/* Budget Modal */}
      <Modal isOpen={showBudgetForm} onClose={() => setShowBudgetForm(false)} title={budgetForm.id ? "Edit Budget" : "Tambah Budget"}>
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Kategori</label>
            <SearchableSelect
              options={categories.map(cat => ({ value: String(cat.id), label: cat.name, icon: cat.icon }))}
              value={budgetForm.category}
              onChange={(val) => setBudgetForm({ ...budgetForm, category: val })}
              placeholder="-- Pilih Kategori --"
              searchPlaceholder="Cari kategori..."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Jumlah Budget (Rp)</label>
            <CurrencyInput 
              required 
              value={budgetForm.amount} 
              onChange={(val) => setBudgetForm({ ...budgetForm, amount: val })} 
              className="mobile-input text-lg font-bold" 
              placeholder="500.000" 
            />
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Budget untuk: <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{monthLabel}</span></p>
          
          {budgetForm.id && (
            <div className="flex justify-start">
              <button type="button" onClick={() => { setShowBudgetForm(false); handleDeleteBudget(budgetForm.id!); }} className="text-xs font-bold text-rose-500 flex items-center gap-1 p-2 bg-rose-50 rounded-lg">
                <Trash2 size={13} /> Hapus Budget ini
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowBudgetForm(false)} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ border: '1px solid var(--color-border-input)', color: 'var(--color-text-secondary)' }}>Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-[var(--color-primary)] shadow-lg shadow-teal-500/20">
              {saving ? <><Loader2 size={15} className="animate-spin" /> ...</> : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Plan Modal */}
      {showPlanForm && (
        <div className="fullpage-overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="w-full max-w-md bg-[var(--color-bg-app)] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-card)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{planForm.id ? 'Edit Plan' : 'Buat Planner Baru'}</h2>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <form onSubmit={handleSavePlan} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Kategori Utama</label>
                    <div className="flex items-center gap-1.5">
                      <SearchableSelect
                        options={planCategories.map(c => ({ value: String(c.id), label: c.name }))}
                        value={planForm.category}
                        onChange={(val) => setPlanForm({...planForm, category: val, sub_category: ''})}
                        placeholder="-- Master --"
                        searchPlaceholder="Cari kategori..."
                        className="flex-1"
                      />
                      <button type="button" onClick={handleCreatePlanCategory} className="w-10 h-[48px] shrink-0 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors">
                        <PlusCircle size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Sub Kategori</label>
                    <div className="flex items-center gap-1.5">
                      <SearchableSelect
                        options={planSubCategories.filter(sc => String(sc.category) === planForm.category).map(sc => ({ value: String(sc.id), label: sc.name }))}
                        value={planForm.sub_category}
                        onChange={(val) => setPlanForm({...planForm, sub_category: val})}
                        placeholder="-- Master --"
                        searchPlaceholder="Cari sub kategori..."
                        disabled={!planForm.category}
                        className="flex-1"
                      />
                      <button type="button" onClick={handleCreatePlanSubCategory} disabled={!planForm.category} className="w-10 h-[48px] shrink-0 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 disabled:opacity-50 disabled:bg-slate-50 hover:bg-indigo-100 transition-colors">
                        <PlusCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Nama Item Plan *</label>
                  <input required type="text" value={planForm.item_name} onChange={e => setPlanForm({...planForm, item_name: e.target.value})} className="mobile-input" placeholder="Misal: Cincin Nikah" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Nominal Estimasi (Rp) *</label>
                  <CurrencyInput 
                    required 
                    value={planForm.amount} 
                    onChange={val => setPlanForm({...planForm, amount: val})} 
                    className="mobile-input text-lg font-bold" 
                    placeholder="5.000.000" 
                  />
                </div>

                <div>
                   <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Target Tanggal Realisasi</label>
                   <input required type="date" value={planForm.target_date} onChange={e => setPlanForm({...planForm, target_date: e.target.value})} className="mobile-input" />
                </div>

                <div>
                   <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-section-label)' }}>Catatan Tambahan</label>
                   <textarea value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} className="mobile-input text-xs" placeholder="Opsional" rows={2} />
                </div>

                {planForm.id && (
                  <div className="flex justify-start pt-1">
                    <button type="button" onClick={() => { setShowPlanForm(false); handleDeletePlan(planForm.id!); }} className="text-xs font-bold text-rose-500 flex items-center gap-1 p-2 bg-rose-50 rounded-lg">
                      <Trash2 size={13} /> Hapus Item Plan
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-3 pb-3 border-t" style={{ borderColor: 'var(--color-border-card)' }}>
                  <button type="button" onClick={() => setShowPlanForm(false)} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-slate-100 text-slate-600">Batal</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm bg-[var(--color-primary)]">
                    {saving ? 'Loading...' : 'Simpan Plan'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
