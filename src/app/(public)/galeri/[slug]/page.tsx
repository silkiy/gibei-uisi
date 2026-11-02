import { StructuredData } from '@/seo/StructuredData';
import { routeMetadata } from '@/seo/metadata';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { publicPageData } from '@/content/public-pages';
import { p1Detail } from '@/content/p1-read';
import { P1Content } from '@/components/public/P1Content';
export default async function Page({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params,item=await publicPageData(req=>p1Detail(req,'galleries',slug));if(!item) notFound();
 return <><StructuredData path={`/galeri/${item.slug}`} title={item.title} description={item.description} type="CollectionPage"/><main id="main-content" tabIndex={-1} className="page-width publication-main"><Link href="/galeri" prefetch={false}>← Semua album</Link><article><h1>{item.title}</h1><P1Content item={item}/></article></main></>;
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {return routeMetadata('/galeri/'+(await params).slug);}
