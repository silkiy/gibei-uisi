import { publicPageData } from '../../../../content/public-pages';
import { publicArticles, publicArticleCategories } from '../../../../content/public-read';
import { articleSearch } from '../../../../content/article-search';
import { EmptyState } from '../../../../components/public/EmptyState';
import Link from 'next/link';

export default async function ArticleList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const input = await searchParams, query = new URLSearchParams();
  for (const key of ['q', 'category', 'page', 'limit']) if (typeof input[key] === 'string') query.set(key, input[key]);
  const filters = articleSearch(query);
  const { result, categories } = await publicPageData(async req => ({ result: await publicArticles(req, query), categories: await publicArticleCategories(req) }));
  const pageURL = (page: number) => `/publikasi/artikel?${new URLSearchParams({ q: filters.q, category: filters.category, limit: String(filters.limit), page: String(page) })}`;
  return <main id="main-content" tabIndex={-1} className="page-width publication-main">
    <div className="publication-intro"><div><p className="section-label">Ruang baca / Publikasi</p><h1>Artikel &amp; edukasi</h1></div><p>Temukan perspektif, pahami dasar-dasarnya, dan terus belajar tentang pasar modal.</p></div>
    <form className="article-filters" method="get" action="/publikasi/artikel">
      <label>Cari artikel<input type="search" name="q" defaultValue={filters.q} maxLength={120} placeholder="Judul atau ringkasan" /></label>
      <label>Kategori artikel<select name="category" defaultValue={filters.category}><option value="">Semua kategori</option>
        {filters.category && !categories.some(category => category.slug === filters.category) && <option value={filters.category}>Kategori tidak dikenal</option>}
        {categories.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}
      </select></label>
      <label>Artikel per halaman<select name="limit" defaultValue={filters.limit}>{[...new Set([12, 24, 48, filters.limit])].sort((a,b) => a-b).map(limit => <option key={limit} value={limit}>{limit}</option>)}</select></label>
      <button className="button-primary" type="submit">Tampilkan artikel</button>
    </form>
    <p role="status" className="article-result-count">{result.totalDocs} artikel · Halaman {result.page} dari {result.totalPages}</p>
    {result.docs.length ? <ol className="article-list">{result.docs.map(article => <li key={article.id}><article className="article-row">
      <div className="article-row-meta"><span>{article.category?.name || 'Artikel'}</span><time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}</time></div>
      <div><p className="demo-label">Konten pratinjau · belum dikonfirmasi resmi</p><h2><Link prefetch={false} href={`/publikasi/artikel/${article.slug}`}>{article.title}<span aria-hidden="true"> ↗</span></Link></h2><p>{article.excerpt}</p><span className="article-author">{article.publicAuthor}</span></div>
    </article></li>)}</ol> : <EmptyState title={result.outOfRange ? 'Halaman ini tidak memiliki artikel.' : 'Belum ada artikel yang sesuai.'}>Coba kata kunci atau kategori lain. {result.outOfRange && <Link prefetch={false} href={pageURL(1)}>Kembali ke halaman pertama</Link>}</EmptyState>}
    {result.docs.length > 0 && result.totalPages > 1 && <nav className="article-pagination" aria-label="Halaman artikel">
      {result.page > 1 && <Link prefetch={false} href={pageURL(result.page - 1)}>Halaman sebelumnya</Link>}
      <span aria-current="page">Halaman {result.page}</span>
      {result.page < result.totalPages && <Link prefetch={false} href={pageURL(result.page + 1)}>Halaman berikutnya</Link>}
    </nav>}
    <div className="education-note"><span>Catatan edukasi</span><p>Materi ditujukan untuk pembelajaran, bukan rekomendasi membeli atau menjual efek.</p></div>
  </main>;
}
