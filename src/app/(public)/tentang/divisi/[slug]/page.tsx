import Link from 'next/link';
import { notFound } from 'next/navigation';
import { publicPageData } from '../../../../../content/public-pages';
import { publicDivisions } from '../../../../../content/organization-read';

export default async function DivisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [division] = await publicPageData(req => publicDivisions(req, slug));
  if (!division) notFound();
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Tentang · Divisi</p><h1>{division.name}</h1>
    {division.example && <p>Data contoh · belum dikonfirmasi resmi</p>}
    <section className="cms-section"><h2>Profil</h2><p>{division.description}</p></section>
    <section className="cms-section"><h2>Program kerja</h2><p>{division.workPrograms}</p></section>
    <p className="cms-section"><Link prefetch={false} href="/tentang/divisi">← Semua divisi</Link></p>
  </main>;
}
