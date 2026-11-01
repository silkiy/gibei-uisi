import Link from 'next/link';
import { publicPageData } from '../../../content/public-pages';
import { publishedPage } from '../../../content/pages-read';
import { PageSections } from '../../../components/public/PageSections';
import { activeRecruitment } from '../../../content/recruitment-read';

export default async function AboutPage() {
  const {page,campaign} = await publicPageData(async req => {
    const page = await publishedPage(req,'about');
    const needsRegistration = page?.sections.some(section=>section.blockType==='cta' && section.url==='/rekrutmen');
    return {page,campaign:needsRegistration ? await activeRecruitment(req) : null};
  });
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Galeri Investasi · Tentang</p>
    <h1>{page?.title || 'Tentang GIBEI UISI'}</h1>
    {page ? <PageSections sections={page.sections} registration={campaign} /> : <p role="status">Profil, sejarah, visi, dan misi sedang disiapkan untuk publikasi.</p>}
    <p className="cms-section"><Link prefetch={false} href="/tentang/divisi">Kenali delapan divisi →</Link></p>
    <p><Link prefetch={false} href="/tentang/struktur">Lihat kepengurusan per periode →</Link></p>
  </main>;
}
