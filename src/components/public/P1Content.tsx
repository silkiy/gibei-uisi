import Image from 'next/image';
import Link from 'next/link';
import type { publicP1 } from '../../content/p1-read';
type Item=Awaited<ReturnType<typeof publicP1>>['docs'][number];
export function P1Content({item}:{item:Item}) {
  return <><p>{item.description}</p>{item.example && <p className="quiet-note">Data contoh · bukan informasi resmi.</p>}
    {item.date && <time dateTime={item.date}>{item.date}</time>}{item.category && <p>{item.category}{item.recipient && ` · ${item.recipient}`}</p>}
    {item.collaboration && <p>Kolaborasi: {item.collaboration}</p>}
    {item.assets.length>0 && <div className="gallery-grid">{item.assets.map((asset,index)=><figure key={`${asset.id}-${index}`}>{asset.available && asset.url ? <Image unoptimized src={asset.url} alt={asset.alt} width={asset.width||640} height={asset.height||480} className="public-image"/> : <p>Gambar tidak tersedia.</p>}{asset.caption && <figcaption>{asset.caption}</figcaption>}</figure>)}</div>}
    {item.event && <p><Link prefetch={false} href={`/kegiatan/${item.event.slug}`}>Kegiatan: {item.event.title} →</Link></p>}
    {item.videoURL && <p><a href={item.videoURL} rel="noopener noreferrer" target="_blank">Tonton video eksternal ↗</a></p>}
    {item.website && <p><a href={item.website} rel="noopener noreferrer" target="_blank">Website mitra ↗</a></p>}</>;
}
