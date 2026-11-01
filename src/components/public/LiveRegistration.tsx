'use client';

import { useEffect, useState } from 'react';

export type RegistrationState = { status: string; canRegister: boolean; registrationURL: string | null; serverNow: number; refreshAt: number | null };
const labels: Record<string, string> = { upcoming: 'Akan datang', ongoing: 'Sedang berlangsung', completed: 'Selesai', cancelled: 'Dibatalkan', not_open: 'Belum dibuka', open: 'Terbuka', closed: 'Ditutup', disabled: 'Tidak diaktifkan', unavailable: 'Tidak tersedia' };
// A server deadline limits the lifetime of the link, including when a tab stays open.
// Hide before refetch; a failed refresh must never keep a stale registration link.
export function LiveRegistration({ initial, endpoint }: { initial: RegistrationState; endpoint: string }) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    let alive = true, busy = false;
    const started = performance.now();
    const refresh = async () => {
      if (busy) return;
      busy = true;
      if (alive) setState(current => ({ ...current, canRegister: false, registrationURL: null }));
      try {
        const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw Error('Publication unavailable');
        const next: RegistrationState = await response.json();
        if (alive) setState(next);
      } catch { if (alive) setState(current => ({ ...current, status: 'unavailable', canRegister: false, registrationURL: null })); }
      finally { busy = false; }
    };
    const delay = Math.max(0, Math.min(30000, state.refreshAt == null ? 30000 : state.refreshAt - state.serverNow));
    const timer = window.setTimeout(refresh, delay);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    // Revalidate on a restored page, including bfcache and background-tab suspension.
    window.addEventListener('pageshow', refresh); document.addEventListener('visibilitychange', visible);
    const guard = (event: MouseEvent) => {
      if (state.refreshAt != null && performance.now() - started >= state.refreshAt - state.serverNow) { event.preventDefault(); void refresh(); }
    };
    const link = document.querySelector<HTMLAnchorElement>(`a[data-registration="${endpoint}"]`);
    link?.addEventListener('click', guard);
    return () => { alive = false; clearTimeout(timer); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', visible); link?.removeEventListener('click', guard); };
  }, [endpoint, state.serverNow, state.refreshAt]);
  return <div className="registration-state" aria-live="polite"><p>Status: <strong>{labels[state.status] || 'Tidak tersedia'}</strong></p>
    {state.canRegister && state.registrationURL && <a className="button-primary" data-registration={endpoint} href={state.registrationURL} rel="noopener noreferrer">Daftar sekarang ↗</a>}
    {!state.canRegister && <p>Pendaftaran belum tersedia atau sudah ditutup.</p>}
  </div>;
}
