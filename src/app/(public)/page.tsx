import { publicPageData } from '../../content/public-pages';
import { homepageData } from '../../content/homepage';
import { PageSections } from '../../components/public/PageSections';
import { PublicationLinks } from '../../components/public/PublicationLinks';
import { LiveRegistration } from '../../components/public/LiveRegistration';
import { EmptyState } from '@/components/public/EmptyState';
import Link from 'next/link';

export default async function HomePage() {
  const data=await publicPageData(homepageData);
  const hero=data.home?.sections.find(section=>section.blockType==='hero');
  const sections=(data.home?.sections || []).filter(section=>section.blockType!=='hero');
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="hero page-width" aria-labelledby="hero-heading">
        <div className="hero-copy min-w-0">
          <p className="section-label"><span className="status-dot" aria-hidden="true" /> Galeri Investasi · UISI</p>
          <h1 id="hero-heading">{hero ? hero.heading : <>Belajar pasar modal.<br /><span>Bertumbuh bersama.</span></>}</h1>
          <p className="hero-description text-pretty">{hero?.summary || 'Ruang untuk memahami investasi, bertukar perspektif, dan membangun kebiasaan belajar yang kritis.'}</p>
          <a className="button-primary" href="#tentang">Kenali GIBEI UISI <span aria-hidden="true">↗</span></a>
          <div className="hero-footnote"><span aria-hidden="true">↓</span><p>Pengetahuan yang dibagikan.<br />Perspektif yang terus berkembang.</p></div>
        </div>
        <div className="learning-poster" role="img" aria-label="Ilustrasi konseptual buku terbuka: baca, diskusi, pahami.">
          <div className="poster-top"><span>RUANG UNTUK<br />RASA INGIN TAHU.</span><span aria-hidden="true">↗</span></div>
          <svg viewBox="0 0 480 340" fill="none" aria-hidden="true" className="book-illustration">
            <circle cx="337" cy="115" r="81" fill="currentColor" />
            <path d="M63 112L235 167L411 110V259L237 318L63 263Z" fill="#174e3d" stroke="#e5eddf" strokeWidth="1.5" />
            <path d="M235 167V318M80 256L236 306L394 252" stroke="#9bbba3" strokeWidth="1.5" />
            <path d="M70 79C133 72 178 89 236 128C293 89 338 72 402 79V236C340 229 291 244 236 280C181 244 130 229 70 236Z" fill="#edf0e4" />
            <path d="M236 128V280M91 107C146 105 181 119 213 141M91 129C146 127 181 141 213 163M91 151C146 149 181 163 213 185M91 173C146 171 181 185 213 207M258 141C297 117 336 104 380 107M258 163C297 139 336 126 380 129M258 185C297 161 336 148 380 151M258 207C297 183 336 170 380 173" stroke="#829887" strokeWidth="1.5" />
            <path d="M304 101V171L323 156L342 165V86" fill="#d3ed8b" />
          </svg>
          <div className="poster-bottom"><span>Baca.<br />Diskusi.<br /><strong>Pahami.</strong></span><span className="poster-caption">Investasi dimulai<br />dari pemahaman.</span></div>
        </div>
      </section>
      <section className="about-section" id="tentang" tabIndex={-1} aria-labelledby="about-heading">
        <div className="page-width about-grid"><p className="section-label">01 / Tentang GIBEI UISI</p><div>{data.about ? <><h2 id="about-heading">{data.about.title}</h2><PageSections sections={data.about.sections} registration={data.campaign} /></> : <><h2 id="about-heading">Tempat bertemu<br />ilmu dan rasa ingin tahu.</h2><p>Galeri Investasi UISI menjadi ruang informasi dan pembelajaran pasar modal bagi komunitas kampus.</p><p className="quiet-note">Profil lengkap dan informasi organisasi akan ditampilkan setelah dikonfirmasi.</p></>}<Link prefetch={false} href="/tentang">Baca profil lengkap →</Link> · <Link prefetch={false} href="/tentang/struktur">Struktur pengurus →</Link></div></div>
      </section>
      <div className="page-width content-sections">
        <PageSections sections={sections} registration={data.campaign} />
        <section id="publikasi" tabIndex={-1} aria-labelledby="publications-heading">
          <div className="section-heading"><div><p className="section-label">02 / Publikasi</p><h2 id="publications-heading">Wawasan untuk<br />langkah berikutnya.</h2></div><span className="section-aside">Artikel &amp; riset</span></div>
          {data.articles.length ? <><h3>Artikel terbaru</h3><PublicationLinks docs={data.articles} kind="artikel" /></> : <EmptyState title="Belum ada artikel terbit.">Artikel yang telah melalui review akan ditampilkan di sini.</EmptyState>}
          {data.research.length ? <><h3>Riset terbaru</h3><PublicationLinks docs={data.research} kind="riset" /></> : <EmptyState title="Belum ada riset terbit.">Riset yang telah melalui review akan ditampilkan di sini.</EmptyState>}
          <Link prefetch={false} className="button-primary" href="/publikasi">Jelajahi publikasi <span aria-hidden="true">↗</span></Link>
        </section>
        <section id="agenda" tabIndex={-1} aria-labelledby="agenda-heading">
          <div className="section-heading"><div><p className="section-label">03 / Agenda</p><h2 id="agenda-heading">Belajar juga berarti<br />bertemu dan berbagi.</h2></div><span className="section-aside">Kegiatan &amp; diskusi</span></div>
          {data.events.length ? <ol className="article-list">{data.events.map(event=><li key={event.id}><article className="article-row"><time dateTime={event.startAt}>{new Date(event.startAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</time><h3><Link prefetch={false} href={`/kegiatan/${event.slug}`}>{event.title} ↗</Link></h3></article></li>)}</ol> : <EmptyState title="Nantikan agenda berikutnya.">Belum ada kegiatan mendatang yang telah disetujui.</EmptyState>}
          <Link prefetch={false} className="text-link" href="/kegiatan">Semua kegiatan & arsip →</Link>
        </section>
        <section aria-labelledby="recruitment-heading"><p className="section-label">04 / Bertumbuh bersama</p><h2 id="recruitment-heading">Rekrutmen</h2>{data.campaign ? <><h3>{data.campaign.title}</h3><LiveRegistration initial={data.campaign} endpoint={`/api/public/recruitment/${data.campaign.slug}`}/></> : <p>Belum ada kampanye rekrutmen yang diaktifkan.</p>}<Link prefetch={false} className="text-link" href="/rekrutmen">Informasi posisi & riwayat →</Link></section>
        <section aria-labelledby="community-heading"><h2 id="community-heading">Jejak &amp; kolaborasi</h2><p>Informasi prestasi dan mitra akan ditampilkan setelah tersedia dan disetujui.</p></section>
      </div>
      <div className="page-width education-note"><span>Catatan edukasi</span><p>Materi di website ini ditujukan untuk pembelajaran, bukan rekomendasi membeli atau menjual efek.</p></div>
    </main>
  );
}
