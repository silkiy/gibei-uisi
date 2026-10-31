import Link from 'next/link';

export default function ArticleNotFound() {
  return <main id="main-content" tabIndex={-1} className="page-width publication-main"><p className="section-label">Ruang baca</p><h1>Artikel tidak tersedia.</h1><p>Artikel belum terbit, sudah ditarik, atau alamatnya tidak ditemukan.</p><Link prefetch={false} className="button-primary" href="/publikasi/artikel">Kembali ke daftar artikel</Link></main>;
}
