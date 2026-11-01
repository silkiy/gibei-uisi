import Image from 'next/image';
import { publicPageData } from '../../../../content/public-pages';
import { structureData } from '../../../../content/members-read';
import { divisionNames } from '../../../../validation/organization.mjs';

const names = new Map<string, string>(Object.entries(divisionNames));
export default async function Structure({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const selected = (await searchParams).periode;
  const data = await publicPageData(req => structureData(req, selected));
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Tentang · Kepengurusan</p><h1>Struktur organisasi</h1>
    {!data.activePeriod && <p role="status">Periode aktif belum ditetapkan. Pilih periode untuk melihat arsip kepengurusan.</p>}
    <form method="get" className="cms-section structure-filter"><label htmlFor="period-select">Periode kepengurusan</label><select id="period-select" name="periode" defaultValue={data.period?.id || ''}>
      <option value="">Pilih periode</option>{data.periods.map(period => <option key={period.id} value={period.id}>{period.label}</option>)}
    </select><button type="submit">Tampilkan</button></form>
    {data.period && <h2>{data.period.label}</h2>}
    {data.period && !data.members.length && <p role="status">Pengurus terbit pada periode ini belum tersedia.</p>}
    {!data.period && selected && <p role="status">Periode yang dipilih tidak tersedia untuk publik.</p>}
    {data.members.map((member, i) => <article className="cms-section" key={i}>
      {member.example && <p>Data contoh · belum dikonfirmasi resmi</p>}
      {member.photo?.url && <Image unoptimized src={member.photo.url} alt={member.photo.alt} width={member.photo.width || 240} height={member.photo.height || 240} style={{ maxWidth: 180, height: 'auto' }} />}
      {member.photo && !member.photo.available && <p>Foto tidak tersedia.</p>}
      <h3>{member.name}</h3><p>{member.position}</p>{member.division && <p>{names.get(member.division)}</p>}
    </article>)}
  </main>;
}
