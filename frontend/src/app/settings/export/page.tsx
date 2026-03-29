'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Check, AlertCircle } from 'lucide-react';
import { exportCsv } from '@/lib/api';

export default function ExportPage() {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await exportCsv();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDone(true);
    } catch {
      setError('Gagal mengunduh data. Pastikan ada data transaksi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Data</p>
            <h1 className="text-xl font-bold text-white">Export Data</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-5 space-y-5">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms', opacity: 0 }}>
          <div className="mobile-card p-6 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(20, 184, 166, 0.1))' }}>
              <FileSpreadsheet size={36} className="text-teal-500" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Export Transaksi</h3>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Unduh semua data transaksi kamu dalam format CSV.
              File bisa dibuka di Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
            </p>

            <div className="mt-5 mobile-card p-3 text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-section-label)' }}>Kolom yang diekspor:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah', 'Metode Bayar', 'Tipe Saldo'].map((col) => (
                  <div key={col} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{col}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-500 font-medium">{error}</p>
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: '60ms', opacity: 0 }}>
          <button
            onClick={handleExport}
            disabled={downloading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: done
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.35)',
            }}
          >
            {downloading ? <><Loader2 size={16} className="animate-spin" /> Mengunduh...</>
              : done ? <><Check size={16} /> Berhasil Diunduh!</>
              : <><Download size={16} /> Unduh CSV</>}
          </button>
        </div>
      </div>
    </div>
  );
}
