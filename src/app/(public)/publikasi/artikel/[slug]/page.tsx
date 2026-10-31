import { notFound } from 'next/navigation';
import Link from 'next/link';
import { publicPageData } from '../../../../../content/public-pages';
import { findPublicArticle } from '../../../../../content/public-read';
import { RichText } from '../../../../../components/public/RichText';

export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const doc = await publicPageData(req => findPublicArticle(req, slug));
  if (!doc) notFound();
  return <main id="main-content" tabIndex={-1} className="page-width publication-main">
    <article className="article-detail">
      <Link prefetch={false} className="article-back" href="/publikasi/artikel">← Semua artikel</Link>
      <p className="section-label">{doc.category?.name || 'Artikel & edukasi'}</p>
      <h1>{doc.title}</h1><p className="article-lead">{doc.excerpt}</p>
      <p className="article-meta"><span>{doc.publicAuthor}</span><span>Terbit <time dateTime={doc.publishedAt}>{new Date(doc.publishedAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}</time></span></p>
      <p className="demo-label">Konten pratinjau · belum dikonfirmasi sebagai materi resmi organisasi.</p>
      <RichText body={doc.body} assets={doc.assets} />
      {doc.sources?.length ? <section className="article-sources" aria-labelledby="sources-heading"><h2 id="sources-heading">Sumber &amp; bacaan</h2><ul>{doc.sources.map((source, index) => <li key={index}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}</a></li>)}</ul></section> : null}
      <aside className="education-note"><span>Catatan edukasi</span><p>Publikasi ini untuk edukasi dan informasi, bukan rekomendasi membeli atau menjual efek. Keputusan investasi dan risikonya menjadi tanggung jawab masing-masing pembaca.</p></aside>
      {doc.related.length ? <section className="article-sources" aria-labelledby="related-heading"><h2 id="related-heading">Baca juga</h2><ul>{doc.related.map(target => <li key={target.id}><Link prefetch={false} href={`/publikasi/artikel/${target.slug}`}>{target.title}</Link></li>)}</ul></section> : null}
    </article>
  </main>;
}
