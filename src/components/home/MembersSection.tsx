import Image from 'next/image';

const members = [
  {
    name: 'Nama Ketua Umum',
    role: 'Ketua Umum',
  },
  {
    name: 'Nama Wakil Ketua',
    role: 'Wakil Ketua',
  },
  {
    name: 'Nama Sekretaris',
    role: 'Sekretaris',
  },
  {
    name: 'Nama Bendahara',
    role: 'Bendahara',
  },
] as const;

export function MembersSection() {
  return (
    <section
      className="section members-section"
      id="pengurus"
      aria-labelledby="members-title"
      tabIndex={-1}
    >
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Pengurus GIBEI UISI</p>
          <h2 id="members-title">Anggota Pengurus</h2>
          <p>
            Kenali penggerak utama yang memimpin, mengelola, dan mengembangkan aktivitas GIBEI UISI.
          </p>
        </div>
        <p className="section-note centered" id="members-note">
          Data contoh · nama dan foto pengurus resmi akan diperbarui.
        </p>
        <ul className="members-grid" aria-describedby="members-note">
          {members.map((member) => (
            <li key={member.role}>
              <article className="member-card">
                <div className="member-photo">
                  <Image
                    src="/images/gibei-mark.jpg"
                    alt={`Foto contoh ${member.name}`}
                    width={640}
                    height={800}
                    sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 899px) 50vw, 300px"
                  />
                  <span className="member-photo-label">Foto ilustrasi</span>
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
