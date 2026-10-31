import Link from 'next/link';
import { publicPageData } from '../../../../content/public-pages';
import { publicDivisions } from '../../../../content/organization-read';

export default async function DivisionsPage() {
  const divisions = await publicPageData(publicDivisions);
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Tentang · Organisasi</p><h1>Delapan divisi, satu ruang belajar.</h1>
    <p>Kenali peran dan program kerja divisi GIBEI UISI.</p>
    {!divisions.length && <p role="status">Profil divisi sedang disiapkan untuk publikasi.</p>}
    {divisions.map(division => <article className="cms-section" key={division.slug}>
      {division.example && <p className="section-label">Data contoh · belum dikonfirmasi resmi</p>}
      <h2><Link prefetch={false} href={`/tentang/divisi/${division.slug}`}>{division.name} →</Link></h2><p>{division.description}</p>
    </article>)}
  </main>;
}
