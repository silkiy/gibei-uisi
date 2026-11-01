import Link from 'next/link';
type Summary={id:number;slug:string;title:string;excerpt:string;publishedAt:string};
export function PublicationLinks({docs,kind}:{docs:Summary[];kind:'artikel'|'riset'}) {
  return <ol className="article-list">{docs.map(doc=><li key={doc.id}><article className="article-row"><time dateTime={doc.publishedAt}>{new Date(doc.publishedAt).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'})}</time><div><h3><Link prefetch={false} href={`/publikasi/${kind}/${doc.slug}`}>{doc.title} ↗</Link></h3><p>{doc.excerpt}</p></div></article></li>)}</ol>;
}
