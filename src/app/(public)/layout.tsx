import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SiteHeader } from '@/components/public/SiteHeader';
import { SiteFooter } from '@/components/public/SiteFooter';
import './globals.css';
import { publicPageData } from '../../content/public-pages';
import { publicSettings } from '../../content/site-settings';

const manrope = localFont({ src: '../../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', display: 'swap', variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'GIBEI UISI — Ruang belajar pasar modal',
  description: 'Pratinjau website Galeri Investasi Universitas Internasional Semen Indonesia. Ruang belajar, publikasi, dan kegiatan pasar modal.',
  robots: { index: false, follow: false },
};

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await publicPageData(publicSettings);
  return <html lang="id" className={manrope.variable}><body>
    <a className="skip-link" href="#main-content">Langsung ke konten</a>
    <div className="preview-notice"><div className="page-width"><span className="preview-label">Pratinjau lokal</span><span>Website dalam pengembangan. Identitas dan konten belum final.</span></div></div>
    {settings.favicon && <link rel="icon" href={settings.favicon.url} />}
    <SiteHeader settings={settings} />{children}<SiteFooter settings={settings} />
  </body></html>;
}
