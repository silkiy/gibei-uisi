import Link from 'next/link';
import { notFound } from 'next/navigation';
import { publicPageData } from '../../../../../content/public-pages';
import { researchDetail } from '../../../../../content/research-read';
import { RichText } from '../../../../../components/public/RichText';

export default async function ResearchDetail({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const research = await publicPageData(req => researchDetail(req, slug));
  if (!research) notFound();
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Publikasi · Riset · {research.category?.name}</p><h1>{research.title}</h1>
    <p>Tim/penulis: {research.publicAuthor}</p><p>Tanggal analisis: <time dateTime={research.analysisDate}>{research.analysisDate}</time></p>
    <p>Dipublikasikan: <time dateTime={research.publishedAt}>{new Date(research.publishedAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
    <p className="cms-section">{research.excerpt}</p><div className="article-body"><RichText body={research.body} assets={research.assets} /></div>
    <section className="cms-section"><h2>Sumber dan referensi</h2><ul>{research.sources.map((source, i) => <li key={i}><a href={source.url} rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></section>
    <aside className="cms-section" aria-label="Disclaimer riset"><h2>Catatan edukasi dan risiko</h2><p>{research.disclaimer}</p>{research.additionalNote && <p>{research.additionalNote}</p>}</aside>
    <p className="cms-section"><Link prefetch={false} href="/publikasi/riset">← Semua riset</Link></p>
  </main>;
}
