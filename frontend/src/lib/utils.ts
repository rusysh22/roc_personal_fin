export function formatRupiah(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Append Supabase image transform params to resize profile photos.
 * Supabase Storage supports ?width=&height=&resize= for on-the-fly resizing.
 * Falls back to original URL for non-Supabase URLs.
 */
export function profilePhotoUrl(url: string | null | undefined, size = 80): string | null {
  if (!url) return null;
  if (!url.includes('supabase') && !url.includes('/storage/v1/object/')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${size}&height=${size}&resize=cover`;
}
