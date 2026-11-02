'use client';
import Link from 'next/link';
export default function ErrorPage({retry}:{error:unknown;retry:()=>void}) {
 return <main id="main-content" tabIndex={-1} className="page-width publication-main"><h1>Informasi sementara tidak tersedia.</h1><p>Silakan coba kembali. Konten yang belum tersedia tidak ditampilkan.</p><button className="button-primary" onClick={retry}>Coba lagi</button> <Link prefetch={false} href="/">Kembali ke beranda</Link></main>;
}
