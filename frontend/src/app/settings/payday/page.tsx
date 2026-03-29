'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Check, Loader2 } from 'lucide-react';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getUserSettings, updateUserSettings } from '@/lib/api';

export default function PaydayPage() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getUserSettings()
      .then((res) => setSelectedDay(res.data.payday_date || 1))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserSettings({ payday_date: selectedDay });
      setSaved(true);
      setTimeout(() => router.back(), 800);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="pb-4">
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Keuangan</p>
            <h1 className="text-xl font-bold text-white">Tanggal Gajian</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-5">
        {loading ? (
          <SectionLoading height="300px" />
        ) : (
          <>
            <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
              <div className="mobile-card p-5 text-center">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))' }}>
                  <Calendar size={28} className="text-orange-500" />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Gajian setiap tanggal
                </p>
                <p className="text-4xl font-bold mt-2" style={{ color: 'var(--color-primary)' }}>{selectedDay}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>setiap bulan</p>
              </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '60ms', opacity: 0 }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-section-label)' }}>Pilih Tanggal</p>
              <div className="mobile-card p-4">
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => { setSelectedDay(day); setSaved(false); }}
                      className="w-full aspect-square rounded-xl text-sm font-bold flex items-center justify-center transition-all"
                      style={selectedDay === day
                        ? { background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', color: 'white', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)' }
                        : { background: 'var(--color-filter-bg)', color: 'var(--color-filter-text)' }
                      }
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '120ms', opacity: 0 }}>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{
                  background: saved
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
                  boxShadow: '0 8px 24px rgba(13, 148, 136, 0.35)',
                }}
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                  : saved ? <><Check size={16} /> Tersimpan!</>
                  : <><Check size={16} /> Simpan</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
