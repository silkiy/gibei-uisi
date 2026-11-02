import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicPageData } from '../content/public-pages';
import { publishedPage } from '../content/pages-read';
import { findPublicArticle } from '../content/public-read';
import { researchDetail } from '../content/research-read';
import { eventDetail } from '../content/event-read';
import { p1Detail } from '../content/p1-read';
import { publicDivisions } from '../content/organization-read';
import { canonicalURL } from './policy.mjs';
import type { PayloadRequest } from 'payload';
export const publicRoutes:Record<string,[string,string]>={
 '/':['Beranda','Ruang belajar, program, publikasi, agenda dan kolaborasi.'], '/tentang':['Tentang GIBEI UISI','Profil, sejarah, visi dan misi.'],
 '/tentang/struktur':['Struktur pengurus','Pengurus berdasarkan periode beserta arsip.'], '/tentang/divisi':['Divisi','Profil dan program kerja delapan divisi.'],
 '/publikasi':['Publikasi','Artikel dan riset edukasi pasar modal.'], '/publikasi/artikel':['Artikel','Artikel dan wawasan edukasi investasi.'], '/publikasi/riset':['Riset','Analisis dan riset dengan sumber dan catatan risiko.'],
 '/kegiatan':['Kegiatan','Agenda dan arsip kegiatan.'], '/galeri':['Galeri dokumentasi','Album foto dan catatan kegiatan.'], '/partnership':['Partnership','Informasi kolaborasi yang disetujui.'], '/prestasi':['Prestasi','Pencapaian berdasarkan tahun.'], '/rekrutmen':['Rekrutmen','Posisi, persyaratan dan tahapan rekrutmen.'], '/kontak':['Kontak','Kanal komunikasi yang telah dikonfirmasi.'],
};
export async function seoDocument(req:PayloadRequest,path:string) {
 const settings=await req.payload.findGlobal({slug:'site-settings',req,overrideAccess:true,depth:0});
 const defaultDescription=(route:string)=>[publicRoutes[route][1],settings.seoDescription].filter(Boolean).join(' ');
 if(path==='/' || path==='/tentang') {
  const page=await publishedPage(req,path==='/'?'homepage':'about');
  return {path,title:page?.seoTitle || publicRoutes[path][0],description:page?.seoDescription || defaultDescription(path),type:'WebPage'};
 }
 if(publicRoutes[path]) return {path,title:publicRoutes[path][0],description:defaultDescription(path),type:'WebPage'};
 const slug=path.split('/').at(-1)!;
 const doc=path.startsWith('/publikasi/artikel/')?await findPublicArticle(req,slug):path.startsWith('/publikasi/riset/')?await researchDetail(req,slug):path.startsWith('/kegiatan/')?await eventDetail(req,slug):path.startsWith('/galeri/')?await p1Detail(req,'galleries',slug):path.startsWith('/tentang/divisi/')?(await publicDivisions(req,slug))[0]:null;
 if(!doc) return null;
 return {path,title:'title' in doc?doc.title:doc.name,description:'excerpt' in doc?doc.excerpt:doc.description,type:path.startsWith('/publikasi/')?'Article':path.startsWith('/galeri/')?'CollectionPage':'WebPage'};
}
export async function routeMetadata(path:string):Promise<Metadata> {
 const doc=await publicPageData(req=>seoDocument(req,path));if(!doc) notFound();
 const title=`[Contoh / Pratinjau] ${doc.title} | GIBEI UISI`,description=`Pratinjau lokal, belum dikonfirmasi sebagai informasi resmi. ${doc.description}`.slice(0,300),url=canonicalURL(path);
 return {title,description,alternates:{canonical:url},robots:{index:false,follow:false},openGraph:{title,description,url,type:doc.type==='Article'?'article':'website',locale:'id_ID'},twitter:{card:'summary',title,description}};
}
