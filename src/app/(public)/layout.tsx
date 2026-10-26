import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GIBEI UISI — Pengembangan',
  description: 'Lingkungan pengembangan website GIBEI UISI.',
  robots: { index: false, follow: false },
};

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
