import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SiteHeader } from '@/components/public/SiteHeader';
import { SiteFooter } from '@/components/public/SiteFooter';
import './globals.css';

const manrope = localFont({ src: '../../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', display: 'swap', variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'GIBEI UISI — Ruang belajar pasar modal',
  description: 'Pratinjau website Galeri Investasi Universitas Internasional Semen Indonesia. Ruang belajar, publikasi, dan kegiatan pasar modal.',
  robots: { index: false, follow: false },
};

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={manrope.variable}><body>
    <a className="skip-link" href="#main-content">Langsung ke konten</a>
    <div className="preview-notice"><div className="page-width"><span className="preview-label">Pratinjau lokal</span><span>Website dalam pengembangan. Identitas dan konten belum final.</span></div></div>
    <SiteHeader />{children}<SiteFooter />
  </body></html>;
}
