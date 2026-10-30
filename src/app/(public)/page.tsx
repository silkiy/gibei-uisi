import { EmptyState } from '@/components/public/EmptyState';

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="hero page-width" aria-labelledby="hero-heading">
        <div className="hero-copy min-w-0">
          <p className="section-label"><span className="status-dot" aria-hidden="true" /> Galeri Investasi · UISI</p>
          <h1 id="hero-heading">Belajar pasar modal.<br /><span>Bertumbuh bersama.</span></h1>
          <p className="hero-description text-pretty">Ruang untuk memahami investasi, bertukar perspektif, dan membangun kebiasaan belajar yang kritis.</p>
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
        <div className="page-width about-grid"><p className="section-label">01 / Tentang GIBEI UISI</p><div><h2 id="about-heading">Tempat bertemu<br />ilmu dan rasa ingin tahu.</h2><p>Galeri Investasi UISI menjadi ruang informasi dan pembelajaran pasar modal bagi komunitas kampus.</p><p className="quiet-note">Profil lengkap dan informasi organisasi akan ditampilkan setelah dikonfirmasi.</p></div></div>
      </section>
      <div className="page-width content-sections">
        <section id="publikasi" tabIndex={-1} aria-labelledby="publications-heading">
          <div className="section-heading"><div><p className="section-label">02 / Publikasi</p><h2 id="publications-heading">Wawasan untuk<br />langkah berikutnya.</h2></div><span className="section-aside">Artikel &amp; riset</span></div>
          <EmptyState title="Ruang baca sedang disiapkan.">Artikel dan riset yang telah disetujui akan hadir di sini. Belum ada publikasi yang ditampilkan.</EmptyState>
        </section>
        <section id="agenda" tabIndex={-1} aria-labelledby="agenda-heading">
          <div className="section-heading"><div><p className="section-label">03 / Agenda</p><h2 id="agenda-heading">Belajar juga berarti<br />bertemu dan berbagi.</h2></div><span className="section-aside">Kegiatan &amp; diskusi</span></div>
          <EmptyState title="Nantikan agenda berikutnya.">Informasi kegiatan akan ditampilkan setelah jadwal dan detailnya dikonfirmasi.</EmptyState>
        </section>
      </div>
      <div className="page-width education-note"><span>Catatan edukasi</span><p>Materi di website ini ditujukan untuk pembelajaran, bukan rekomendasi membeli atau menjual efek.</p></div>
    </main>
  );
}
