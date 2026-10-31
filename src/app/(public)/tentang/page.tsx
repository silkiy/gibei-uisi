import Link from 'next/link';
import { publicPageData } from '../../../content/public-pages';
import { publishedPage } from '../../../content/pages-read';
import { PageSections } from '../../../components/public/PageSections';

export default async function AboutPage() {
  const page = await publicPageData(req => publishedPage(req, 'about'));
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Galeri Investasi · Tentang</p>
    <h1>{page?.title || 'Tentang GIBEI UISI'}</h1>
    {page ? <PageSections sections={page.sections} /> : <p role="status">Profil, sejarah, visi, dan misi sedang disiapkan untuk publikasi.</p>}
    <p className="cms-section"><Link prefetch={false} href="/tentang/divisi">Kenali delapan divisi →</Link></p>
  </main>;
}
