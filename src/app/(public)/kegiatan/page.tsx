import Link from 'next/link';
import { publicPageData } from '../../../content/public-pages';
import { publicEvents } from '../../../content/event-read';
import { EmptyState } from '../../../components/public/EmptyState';

export default async function Events({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const input = await searchParams, query = new URLSearchParams();
  for (const key of ['status','page','limit']) if (typeof input[key] === 'string') query.set(key,input[key]);
  if (!['','upcoming','ongoing','completed','cancelled'].includes(query.get('status') || '')) query.delete('status');
  const result = await publicPageData(req => publicEvents(req,query));
  const url = (page:number) => `/kegiatan?${new URLSearchParams({...Object.fromEntries(query),page:String(page)})}`;
  return <main id="main-content" tabIndex={-1} className="page-width publication-main"><p className="section-label">Agenda / GIBEI UISI</p><h1>Kegiatan &amp; diskusi</h1>
    <form className="structure-filter" action="/kegiatan"><label>Status kegiatan<select name="status" defaultValue={query.get('status') || ''}><option value="">Semua kegiatan</option><option value="upcoming">Akan datang</option><option value="ongoing">Sedang berlangsung</option><option value="completed">Arsip selesai</option><option value="cancelled">Dibatalkan</option></select></label><button className="button-primary">Tampilkan kegiatan</button></form>
    <p role="status">{result.totalDocs} kegiatan</p>
    {result.docs.length ? <ol className="article-list">{result.docs.map(event => <li key={event.id}><article className="article-row"><time dateTime={event.startAt}>{new Date(event.startAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</time><div><h2><Link prefetch={false} href={`/kegiatan/${event.slug}`}>{event.title} ↗</Link></h2><p>{event.status === 'cancelled' ? 'Dibatalkan' : event.status === 'completed' ? 'Selesai' : event.status === 'ongoing' ? 'Sedang berlangsung' : 'Akan datang'}</p></div></article></li>)}</ol> : <EmptyState title="Belum ada kegiatan yang sesuai.">Jadwal yang telah disetujui akan ditampilkan di sini.</EmptyState>}
    <nav className="article-pagination" aria-label="Halaman kegiatan">{result.page>1 && <Link prefetch={false} href={url(result.page-1)}>Sebelumnya</Link>}<span>Halaman {result.page} dari {result.totalPages}</span>{result.page<result.totalPages && <Link prefetch={false} href={url(result.page+1)}>Berikutnya</Link>}</nav>
  </main>;
}
