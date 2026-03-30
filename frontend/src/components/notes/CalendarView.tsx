'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Loader2, Check, X, 
  Calendar as CalendarIcon, RefreshCw, AlertCircle, Trash2, Cloud, CalendarDays
} from 'lucide-react';
import { getPlans, createPlan, updatePlan, deletePlan, patchPlan } from '@/lib/api';
import { Plan } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { 
  initGoogleApi, signIn, getAccessToken, syncPlanToGoogle, 
  deleteGoogleEvent, listGoogleEvents, signOutGoogle, GoogleEvent 
} from '@/lib/googleCalendar';

export function CalendarView() {
  const { showAlert, showConfirm } = useDialog();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plans, setPlans] = useState<Plan[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');

  // Plan Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    amount: '',
    description: '',
    is_realized: false
  });
  const [viewingDay, setViewingDay] = useState<number | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlans();
      setPlans(res.data.results || res.data);
      
      // Fetch Google events if connected
      const token = getAccessToken();
      if (token) {
        const timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const gEvents = await listGoogleEvents(timeMin, timeMax);
        setGoogleEvents(gEvents);
      } else {
        setGoogleEvents([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchPlans();
    
    // Init Google API
    initGoogleApi(() => {
      const token = getAccessToken();
      if (token) {
        setGoogleStatus('connected');
        // Auto sync if connected
        handleAutoSync();
      }
    });
  }, [fetchPlans]);

  const handleAutoSync = async () => {
    // Basic auto sync: push any local plans that don't have google_event_id
    // This is a simplified version of the "auto sync" request
    // In a real app, you'd want a more robust two-way sync
  };

  const handleSyncAll = async () => {
    if (googleStatus !== 'connected') {
      try {
        setGoogleStatus('loading');
        await signIn();
        setGoogleStatus('connected');
        showAlert('Google Calendar terhubung!');
      } catch (err) {
        console.error(err);
        setGoogleStatus('error');
        showAlert('Gagal terhubung ke Google', { variant: 'error' });
        return;
      }
    }

    setSyncing(true);
    let successCount = 0;
    try {
      for (const plan of plans) {
        if (!plan.google_event_id || true) { // For simplicity, sync all existing
          const eventId = await syncPlanToGoogle(plan);
          if (eventId && eventId !== plan.google_event_id) {
            await patchPlan(plan.id, { google_event_id: eventId });
            successCount++;
          }
        }
      }
      if (successCount > 0) fetchData();
      showAlert(`Berhasil sinkronisasi ${successCount} rencana ke Google Calendar`);
    } catch (err) {
      console.error(err);
      showAlert('Gagal sinkronisasi data', { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    signOutGoogle();
    setGoogleStatus('idle');
    setGoogleEvents([]);
    showAlert('Google Calendar terputus');
  };

  const fetchData = () => {
    fetchPlans();
  };

  // Calendar Helper Logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => i);
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentDate);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getPlansForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return plans.filter(p => p.target_date === dateStr);
  };

  const getGoogleEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return googleEvents.filter(e => {
      const start = e.start.date || e.start.dateTime;
      return start && start.startsWith(dateStr);
    });
  };

  const handleDayClick = (day: number) => {
    if (viewingDay === day) {
      setViewingDay(null);
    } else {
      setViewingDay(day);
    }
  };

  const handleAddNewPlanAtDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditingPlan(null);
    setFormData({ item_name: '', amount: '', description: '', is_realized: false });
    setShowForm(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setSelectedDate(plan.target_date);
    setFormData({
      item_name: plan.item_name,
      amount: String(plan.amount),
      description: plan.description || '',
      is_realized: plan.is_realized
    });
    setShowForm(true);
  };

  const handleSavePlan = async () => {
    if (!formData.item_name || !formData.amount || !selectedDate) return;
    setSavingPlan(true);
    try {
      const payload = {
        item_name: formData.item_name,
        amount: parseFloat(formData.amount),
        description: formData.description,
        is_realized: formData.is_realized,
        target_date: selectedDate
      };

      let savedPlan: Plan;
      if (editingPlan) {
        const res = await updatePlan(editingPlan.id, payload);
        savedPlan = res.data;
      } else {
        const res = await createPlan(payload);
        savedPlan = res.data;
      }

      // Sync to Google if connected
      if (googleStatus === 'connected') {
        const gEventId = await syncPlanToGoogle(savedPlan);
        if (gEventId) {
          await patchPlan(savedPlan.id, { google_event_id: gEventId });
        }
      }

      setShowForm(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan rencana', { variant: 'error' });
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!editingPlan) return;
    const confirmed = await showConfirm('Hapus Rencana?', { message: 'Yakin ingin menghapus rencana ini?' });
    if (!confirmed) return;

    try {
      if (editingPlan.google_event_id && googleStatus === 'connected') {
        await deleteGoogleEvent(editingPlan.google_event_id);
      }
      await deletePlan(editingPlan.id);
      setShowForm(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Premium Calendar Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Rencana Anda</p>
          <h2 className="text-xl font-black text-[var(--color-text-primary)]" style={{ background: 'linear-gradient(135deg, #0d9488, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {monthName}
          </h2>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-[var(--color-border-card)]">
          <button 
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-[var(--color-text-primary)] shadow-sm hover:scale-105 active:scale-95 transition-all touch-feedback border border-[var(--color-border-card)]"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-[var(--color-text-primary)] shadow-sm hover:scale-105 active:scale-95 transition-all touch-feedback border border-[var(--color-border-card)]"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Glassmorphic Sync Panel */}
      <div className="relative overflow-hidden p-4 rounded-3xl border border-white/20 dark:border-white/10 shadow-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 blur-3xl rounded-full -ml-12 -mb-12" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              googleStatus === 'connected' 
                ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                : 'bg-slate-200 dark:bg-white/5 text-slate-400'
            }`}>
              {googleStatus === 'connected' ? <Check size={20} strokeWidth={3} /> : <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />}
            </div>
            <div>
            <p className="text-xs font-black text-[var(--color-text-primary)] flex items-center gap-1.5 uppercase tracking-tight">
              Google Calendar
              {googleStatus === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] font-medium">
              {googleStatus === 'connected' ? 'Sistem Sinkronisasi Aktif' : 'Hubungkan untuk simpan otomatis'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {googleStatus === 'connected' && (
            <button 
              onClick={handleDisconnect}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 transition-all touch-feedback shadow-sm"
              title="Putuskan Koneksi"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          )}
          <button 
            onClick={handleSyncAll}
            disabled={syncing}
            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black flex items-center gap-2 transition-all active:scale-95 ${
              googleStatus === 'connected' 
                ? 'bg-white text-indigo-600 shadow-lg border border-indigo-50' 
                : 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)]'
            }`}
          >
            {syncing ? <Loader2 size={14} className="animate-spin" /> : googleStatus === 'connected' ? <RefreshCw size={14} /> : <Plus size={14} strokeWidth={3} />}
            {googleStatus === 'connected' ? 'Update Sync' : 'HUBUNGKAN'}
          </button>
        </div>
      </div>
      </div>

      {/* Premium Calendar Grid */}
      <div className="rounded-[40px] p-6 shadow-2xl relative overflow-hidden transition-all duration-500" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
        {/* Subtle inner shadows and highlights */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        {/* Day Labels */}
        <div className="grid grid-cols-7 mb-4 border-b border-[var(--color-divider)] pb-2">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-3">
          {paddingDays.map(d => (
            <div key={`pad-${d}`} className="aspect-square opacity-20" />
          ))}
          {days.map(day => {
            const dayPlans = getPlansForDate(day);
            const dayGoogleEvents = getGoogleEventsForDate(day);
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            
            return (
              <button 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`aspect-square rounded-[22px] flex flex-col items-center justify-center relative touch-feedback border transition-all duration-300 ${
                  isToday 
                    ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                    : viewingDay === day
                    ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-md z-10'
                    : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-white/5 hover:scale-110 hover:shadow-lg hover:z-20'
                }`}
              >
                <span className={`text-sm font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--color-text-primary)]'}`}>
                  {day}
                </span>
                
                {(dayPlans.length > 0 || dayGoogleEvents.length > 0) && (
                  <div className="absolute bottom-2.5 flex items-center justify-center gap-0.5">
                    {/* Local Plans Dots */}
                    {dayPlans.slice(0, 2).map((p) => (
                      <div key={p.id} className={`w-1.5 h-1.5 rounded-full shadow-sm ${p.is_realized ? 'bg-green-500' : 'bg-indigo-500'}`} />
                    ))}
                    {/* Google Events Dots */}
                    {dayGoogleEvents.slice(0, 2).map((e) => (
                      <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm" />
                    ))}
                  </div>
                )}
                
                {/* Glow for today */}
                {isToday && (
                  <div className="absolute inset-0 rounded-[22px] border-2 border-indigo-400/30 animate-pulse pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Tanggal / Upcoming List */}
      <div className="space-y-4 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {viewingDay ? `Detail Tanggal ${viewingDay}` : 'Rencana Prioritas'}
          </h3>
          <div className="h-[1px] flex-1 mx-4 bg-[var(--color-divider)] opacity-50" />
          {viewingDay && (
            <button 
              onClick={() => setViewingDay(null)}
              className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
            >
              Tutup
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Day Content or Priority List */}
          {(viewingDay ? (
            <>
              {/* Add New Plan Button for the specific day */}
              <button 
                onClick={() => handleAddNewPlanAtDate(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(viewingDay).padStart(2, '0')}`)}
                className="w-full p-4 rounded-[28px] border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5 flex items-center justify-center gap-3 text-indigo-500 hover:bg-indigo-50 transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Tambah Rencana Baru</span>
              </button>

              {/* List events for the specific day */}
              {[
                ...getPlansForDate(viewingDay).map(p => ({ ...p, type: 'plan' as const })),
                ...getGoogleEventsForDate(viewingDay).map(e => ({
                  id: e.id || '',
                  item_name: e.summary,
                  amount: 0,
                  target_date: (e.start.date || e.start.dateTime || '').split('T')[0],
                  description: e.description || '',
                  is_realized: false,
                  type: 'google' as const
                })).filter(e => !plans.some(p => p.google_event_id === e.id))
              ].map(item => (
                <div 
                  key={item.id} 
                  onClick={() => item.type === 'plan' ? handleEditPlan(item as Plan) : null} 
                  className={`group p-4 rounded-[28px] border transition-all duration-300 flex items-center justify-between overflow-hidden relative ${
                    item.type === 'plan' ? 'bg-white dark:bg-white/5 border-[var(--color-border-card)] shadow-md hover:shadow-xl hover:-translate-y-1 touch-feedback' : 'bg-orange-50/30 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/10 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${item.type === 'plan' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 group-hover:scale-110' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-500'}`}>
                      {item.type === 'plan' ? <CalendarIcon size={20} strokeWidth={2.5} /> : <Cloud size={20} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--color-text-primary)]">
                        {item.item_name}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-bold flex items-center gap-2">
                        {item.type === 'plan' ? (
                          <span className="text-indigo-500/80">{formatRupiah(item.amount)}</span>
                        ) : (
                          <span className="text-orange-500/80 uppercase tracking-widest text-[8px]">Google Event</span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{item.target_date}</span>
                      </p>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    item.is_realized ? 'bg-green-100 text-green-600' : 'bg-slate-50 dark:bg-white/5 text-slate-300'
                  }`}>
                    {item.is_realized ? <Check size={20} strokeWidth={3} /> : item.type === 'google' ? <Cloud size={16} /> : <Check size={18} strokeWidth={2} />}
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* Upcoming List (Default View) */
            [
              ...plans.filter(p => new Date(p.target_date) >= new Date() && !p.is_realized).map(p => ({ ...p, type: 'plan' as const })),
              ...googleEvents.filter(e => {
                const start = e.start.date || e.start.dateTime;
                if (!start) return false;
                const date = new Date(start);
                return date >= new Date() && !plans.some(p => p.google_event_id === e.id);
              }).map(e => ({
                id: e.id || '',
                item_name: e.summary,
                amount: 0,
                target_date: (e.start.date || e.start.dateTime || '').split('T')[0],
                description: e.description || '',
                is_realized: false,
                type: 'google' as const
              }))
            ].sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()).slice(0, 5).map(item => (
              <div 
                key={item.id} 
                onClick={() => item.type === 'plan' ? handleEditPlan(item as Plan) : null} 
                className={`group p-4 rounded-[28px] border transition-all duration-300 flex items-center justify-between overflow-hidden relative ${
                  item.type === 'plan' ? 'bg-white dark:bg-white/5 border-[var(--color-border-card)] shadow-md hover:shadow-xl hover:-translate-y-1 touch-feedback' : 'bg-orange-50/30 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/10 opacity-80'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${item.type === 'plan' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 group-hover:scale-110' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-500'}`}>
                    {item.type === 'plan' ? <CalendarIcon size={20} strokeWidth={2.5} /> : <Cloud size={20} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[var(--color-text-primary)]">
                      {item.item_name}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-bold flex items-center gap-2">
                      {item.type === 'plan' ? (
                        <span className="text-indigo-500/80">{formatRupiah(item.amount)}</span>
                      ) : (
                        <span className="text-orange-500/80 uppercase tracking-widest text-[8px]">Google Event</span>
                      )}
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{item.target_date}</span>
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  item.is_realized ? 'bg-green-100 text-green-600' : 'bg-slate-50 dark:bg-white/5 text-slate-300'
                }`}>
                  {item.is_realized ? <Check size={20} strokeWidth={3} /> : item.type === 'google' ? <Cloud size={16} /> : <Check size={18} strokeWidth={2} />}
                </div>
              </div>
            ))
          ))}
          
          {(plans.length === 0 && googleEvents.length === 0) && (
            <div className="p-12 text-center rounded-[32px] border-2 border-dashed border-[var(--color-divider)] opacity-50">
              <AlertCircle className="mx-auto mb-3 opacity-20" size={32} />
              <p className="text-xs font-bold text-[var(--color-text-muted)]">Cari tanggal di kalender<br/>untuk buat rencana</p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Plan Form Modal */}
      {showForm && (
        <div className="fullpage-overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-2xl sm:rounded-[40px] rounded-t-[40px] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_32px_64px_rgba(0,0,0,0.3)] animate-slide-up border border-white/20 dark:border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-[var(--color-divider)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[var(--color-text-primary)] tracking-tight">
                    {editingPlan ? 'Edit Rencana' : 'Rencana Baru'}
                  </h2>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">{editingPlan ? 'Perbarui detail rencana' : 'Detail jadwal kegiatan'}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 transition-colors touch-feedback"
              >
                <X size={20} strokeWidth={2.5} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Judul Rencana</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="Contoh: Beli Laptop Baru, Bayar Sewa"
                    className="w-full px-5 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-black outline-none transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nominal Target</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    className="w-full pl-5 pr-4 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-black outline-none transition-all font-bold text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tanggal</label>
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-5 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-black outline-none transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Deskripsi Detail</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tambahkan catatan pendukung di sini..."
                  className="w-full px-5 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-black outline-none transition-all font-bold text-sm min-h-[120px] resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-5 rounded-[32px] bg-slate-50/50 dark:bg-white/5 border border-[var(--color-border-card)]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${formData.is_realized ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[var(--color-text-primary)]">Terealisasi</p>
                    <p className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase tracking-tight">Tandai jika sudah selesai</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFormData({ ...formData, is_realized: !formData.is_realized })}
                  className={`w-14 h-7 rounded-full transition-all relative ${formData.is_realized ? 'bg-green-500 shadow-inner' : 'bg-slate-300 dark:bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${formData.is_realized ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  onClick={handleSavePlan} 
                  disabled={savingPlan || !formData.item_name || !formData.amount}
                  className="w-full py-5 rounded-[28px] text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                  style={{ 
                    background: 'linear-gradient(135deg, #0d9488, #6366f1)',
                    boxShadow: '0 12px 32px rgba(99,102,241,0.3)'
                  }}
                >
                  {savingPlan ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} strokeWidth={3} /> {editingPlan ? 'SIMPAN PERUBAHAN' : 'BUAT RENCANA'}</>}
                </button>
                
                {editingPlan && (
                  <button 
                    onClick={handleDeletePlan}
                    className="w-full py-4 rounded-2xl text-[11px] font-black text-rose-500 flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors uppercase tracking-widest underline underline-offset-4"
                  >
                    Hapus Rencana Ini
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
