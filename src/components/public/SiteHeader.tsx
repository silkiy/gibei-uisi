'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import Image from 'next/image';
import type { PublicSettings } from '../../content/site-settings';

const fallbackNavigation = [
  { href: '/#tentang', label: 'Tentang' },
  { href: '/#publikasi', label: 'Publikasi' },
  { href: '/#agenda', label: 'Agenda' },
];

export function SiteHeader({ settings }: { settings: PublicSettings }) {
  const navigation = settings.navigation.length ? settings.navigation : fallbackNavigation;
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header" onKeyDown={event => {
      if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
    }}>
      <div className="site-header-inner page-width">
        <Link className="wordmark" href="/" prefetch={false}>
          {settings.logo && <Image src={settings.logo.url} alt="" width={48} height={48} unoptimized style={{ objectFit: 'contain' }} />}
          {settings.siteName === 'GIBEI UISI' ? <>
          <span className="wordmark-name">GIBEI<span className="wordmark-dot" aria-hidden="true">.</span></span>
          <span className="wordmark-campus">UISI<span>Galeri Investasi</span></span>
          </> : <span className="wordmark-name">{settings.siteName}</span>}
          <span className="sr-only"> — Beranda</span>
        </Link>
        <button ref={toggle} className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(!open)}>
          <span>{open ? 'Tutup' : 'Menu'}</span><span className="menu-symbol" aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
        <nav id="site-navigation" aria-label="Navigasi utama" className={`site-navigation${open ? ' is-open' : ''}`}>
          {navigation.map((item, index) => <Link key={`${item.href}-${index}`} prefetch={false} href={item.href} rel={item.href.startsWith('https:') ? 'noopener noreferrer' : undefined} onClick={event => {
            setOpen(false);
            document.getElementById(event.currentTarget.hash.slice(1))?.focus({ preventScroll: true });
          }}>{item.label}</Link>)}
          <Link className="nav-contact" prefetch={false} href="/#kontak" onClick={() => { setOpen(false); document.getElementById('kontak')?.focus({ preventScroll: true }); }}>Kontak <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
  );
}
