import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { publicPageData } from '../../../../content/public-pages';
import { eventDetail } from '../../../../content/event-read';
import { LiveRegistration } from '../../../../components/public/LiveRegistration';

export default async function EventDetail({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params, event=await publicPageData(req=>eventDetail(req,slug)); if(!event) notFound();
  const date=(value:string)=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'long',timeStyle:'short'})+' WIB';
  return <main id="main-content" tabIndex={-1} className="page-width publication-main"><Link prefetch={false} href="/kegiatan">← Semua kegiatan</Link><article className="cms-content"><h1>{event.title}</h1><p>{date(event.startAt)} — {date(event.endAt)}</p><p>{event.organizer}</p>
    <p>{event.description}</p><p>{event.locationType==='offline' ? event.location : event.onlineURL && <a href={event.onlineURL} rel="noopener noreferrer">Kanal kegiatan ↗</a>}</p>
    {event.assets.map(asset=>asset.available && asset.url && asset.mime.startsWith('image/') ? <Image unoptimized key={asset.id} src={asset.url} alt={asset.alt} width={asset.width || 640} height={asset.height || 480} className="public-image"/> : <p key={asset.id}>Poster tidak tersedia.</p>)}
    {event.cancelled && <p role="note">Kegiatan dibatalkan: {event.cancellationNote}</p>}
    <LiveRegistration initial={event} endpoint={`/api/public/events/${event.slug}`}/>
  </article></main>;
}
