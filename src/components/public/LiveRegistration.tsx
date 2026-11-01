'use client';

import { useEffect, useRef, useState } from 'react';

export type RegistrationState = { status: string; canRegister: boolean; registrationURL: string | null; serverNow: number; refreshAt: number | null };
const labels: Record<string, string> = { upcoming: 'Akan datang', ongoing: 'Sedang berlangsung', completed: 'Selesai', cancelled: 'Dibatalkan', not_open: 'Belum dibuka', open: 'Terbuka', closed: 'Ditutup', disabled: 'Tidak diaktifkan', unavailable: 'Tidak tersedia' };
// A server deadline limits the lifetime of the link, including when a tab stays open.
// Hide before refetch; a failed refresh must never keep a stale registration link.
export function LiveRegistration({ initial, endpoint, linkOnly = false, linkLabel, linkHref }: { initial: RegistrationState; endpoint: string; linkOnly?: boolean; linkLabel?: string; linkHref?: string }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  // Revalidate before exposing a link: HTML can arrive late or be restored from history.
  const [state, setState] = useState({ ...initial, canRegister: false, registrationURL: null as string | null, serverNow: 0, refreshAt: 0 as number | null });
  useEffect(() => {
    let alive = true, busy = false;
    const started = performance.now();
    const refresh = async () => {
      if (busy) return;
      busy = true;
      if (alive) setState(current => ({ ...current, canRegister: false, registrationURL: null }));
      const requested = performance.now();
      try {
        const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw Error('Publication unavailable');
        const next: RegistrationState = await response.json();
        // Subtract the entire round trip conservatively; transport delay cannot extend a deadline.
        next.serverNow += performance.now() - requested;
        if (next.refreshAt != null && next.serverNow >= next.refreshAt) { next.canRegister = false; next.registrationURL = null; }
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
    const link = linkRef.current;
    link?.addEventListener('click', guard);
    return () => { alive = false; clearTimeout(timer); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', visible); link?.removeEventListener('click', guard); };
  }, [endpoint, state.serverNow, state.refreshAt]);
  const link = state.canRegister && state.registrationURL ? <a ref={linkRef} className={linkOnly ? undefined : 'button-primary'} data-registration={endpoint} href={linkHref || state.registrationURL} rel="noopener noreferrer">{linkLabel || 'Daftar sekarang ↗'}</a> : null;
  if (linkOnly) return link;
  return <div className="registration-state" aria-live="polite"><p>Status: <strong>{labels[state.status] || 'Tidak tersedia'}</strong></p>
    {link}
    {!state.canRegister && <p>Pendaftaran belum tersedia atau sudah ditutup.</p>}
  </div>;
}
