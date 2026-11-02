import { routeMetadata } from '@/seo/metadata';
import Link from 'next/link';
import { publicPageData } from '@/content/public-pages';
import { publicP1 } from '@/content/p1-read';
import { P1Content } from '@/components/public/P1Content';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const values=await searchParams,query=new URLSearchParams();
  for(const key of ['page','year']) if(typeof values[key]==='string') query.set(key,values[key]);
  let data;try{data=await publicPageData(req=>publicP1(req,'partners',query));}catch(error){if(error instanceof Error && 'status' in error && error.status===400) return <main id="main-content" className="page-width publication-main"><h1>Filter tidak valid</h1><Link href="/partnership">Atur ulang filter</Link></main>;throw error;}
  return <main id="main-content" tabIndex={-1} className="page-width publication-main"><p className="section-label">GIBEI UISI · Dokumentasi & kolaborasi</p><h1>Partnership</h1>
    {!data.docs.length && <p>Belum ada informasi terbit untuk pilihan ini.</p>}
    <div className="p1-list">{data.docs.map(item=><article className="cms-section" key={item.id}><h2>{item.title}</h2><P1Content item={item}/></article>)}</div>
    <nav aria-label="Halaman daftar"><p>Halaman {data.page} dari {data.totalPages}</p>{data.page>1 && <Link prefetch={false} href={`/partnership?page=${data.page-1}${query.get('year')?'&year='+query.get('year'):''}`}>← Sebelumnya</Link>}{data.page<data.totalPages && <Link prefetch={false} href={`/partnership?page=${data.page+1}${query.get('year')?'&year='+query.get('year'):''}`}>Berikutnya →</Link>}</nav>
  </main>;
}

export async function generateMetadata() {return routeMetadata('/partnership');}
