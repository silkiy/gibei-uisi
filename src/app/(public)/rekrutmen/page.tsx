import { publicPageData } from '../../../content/public-pages';
import { recruitmentPage } from '../../../content/recruitment-read';
import { EmptyState } from '../../../components/public/EmptyState';
import { LiveRegistration } from '../../../components/public/LiveRegistration';
import Link from 'next/link';
export default async function Recruitment({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const input=await searchParams,{campaign,choices}=await publicPageData(req=>recruitmentPage(req,typeof input.kampanye==='string'?input.kampanye:undefined));
  const date=(value:string)=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'long',timeStyle:'short'})+' WIB';
  return <main id="main-content" tabIndex={-1} className="page-width publication-main"><p className="section-label">Bertumbuh bersama / GIBEI UISI</p><h1>Rekrutmen</h1>
    {!!choices.length && <form action="/rekrutmen" className="structure-filter"><label>Kampanye dan riwayat<select name="kampanye" defaultValue={campaign?.slug || ''}>{choices.map(row=><option key={row.slug} value={row.slug}>{row.title}{row.enabled?' · diaktifkan Admin':''}</option>)}</select></label><button className="button-primary">Lihat kampanye</button></form>}
    {!campaign?<EmptyState title="Informasi rekrutmen belum tersedia.">Kampanye yang telah disetujui akan ditampilkan di sini.</EmptyState>:<article className="cms-content"><h2>{campaign.title}</h2><p>Periode kepengurusan: {campaign.periodLabel}</p><p>{campaign.description}</p><p>{date(campaign.opensAt)} — {date(campaign.closesAt)}</p>
      <section className="cms-section"><h2>Posisi &amp; persyaratan</h2>{campaign.positions.map((position,i)=><section key={i}><h3>{position.title}</h3>{position.division && <Link prefetch={false} href={`/tentang/divisi/${position.division.slug}`}>{position.division.name}</Link>}<p>{position.requirements}</p></section>)}</section>
      <section className="cms-section"><h2>Tahapan seleksi</h2><ol>{campaign.selectionStages.map((stage,i)=><li key={i}><h3>{stage.title}</h3><p>{stage.description}</p></li>)}</ol></section>
      <LiveRegistration key={campaign.slug} initial={campaign} endpoint={`/api/public/recruitment/${campaign.slug}`}/>
    </article>}
  </main>;
}
