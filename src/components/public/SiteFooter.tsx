import type { PublicSettings } from '../../content/site-settings';
import Link from 'next/link';

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  return (
    <footer className="site-footer" id="kontak" tabIndex={-1} aria-labelledby="footer-heading">
      <div className="page-width footer-main">
        <div><p className="section-label">Tetap terhubung</p><h2 id="footer-heading">Percakapan yang baik<br />dimulai dari rasa ingin tahu.</h2></div>
        <div className="footer-contact">
          <p className="footer-brand">{settings.siteName}</p>
          <p>Galeri Investasi<br />Universitas Internasional Semen Indonesia</p>
          {settings.email && <p><a href={`mailto:${settings.email}`}>{settings.email}</a></p>}
          {settings.location && <p style={{ whiteSpace: 'pre-line' }}>{settings.location}</p>}
          {settings.socials.map((social, index) => <p key={index}><a href={social.url} rel="noopener noreferrer">{social.label} ↗</a></p>)}
          {!settings.email && !settings.location && !settings.socials.length && <p className="contact-pending">Kontak dan kanal resmi sedang dikonfirmasi.</p>}
        </div>
      </div>
      {!!settings.navigation.length && <nav className="page-width footer-links" aria-label="Navigasi footer">{settings.navigation.map((item, index) => item.href.startsWith('/')
        ? <Link key={index} prefetch={false} href={item.href}>{item.label}</Link>
        : <a key={index} href={item.href} rel="noopener noreferrer">{item.label} ↗</a>)}</nav>}
      <div className="page-width footer-bottom"><span>{settings.footerText || `${settings.siteName} · Pratinjau pengembangan`}</span><a href="#main-content">Kembali ke atas <span aria-hidden="true">↑</span></a></div>
    </footer>
  );
}
