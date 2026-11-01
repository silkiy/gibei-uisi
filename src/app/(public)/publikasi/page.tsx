import Link from 'next/link';
import { publicPageData } from '../../../content/public-pages';
import { publicationIndex } from '../../../content/publication-index';
import { PublicationLinks } from '../../../components/public/PublicationLinks';
import { EmptyState } from '../../../components/public/EmptyState';
export default async function Publications() {
  const data=await publicPageData(publicationIndex);
  return <main id="main-content" tabIndex={-1} className="page-width publication-main"><p className="section-label">Ruang baca / GIBEI UISI</p><h1>Publikasi</h1><p>Artikel dan riset untuk memahami pasar modal, melalui proses review sebelum diterbitkan.</p>
    {(['artikel','riset'] as const).map(kind=>{const docs=kind==='artikel'?data.articles:data.research;return <section className="cms-section" key={kind}><h2>{kind==='artikel'?'Artikel terbaru':'Riset terbaru'}</h2><Link prefetch={false} className="text-link" href={`/publikasi/${kind}`}>Lihat semua {kind} →</Link>{docs.length?<PublicationLinks docs={docs} kind={kind}/>:<EmptyState title={`Belum ada ${kind} terbit.`}>Publikasi yang telah disetujui akan ditampilkan di sini.</EmptyState>}</section>;})}
  </main>;
}
