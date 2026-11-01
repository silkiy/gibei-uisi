# Kontrak editorial — T003

Tanggal: 23 Oktober 2026. Status: **rancangan pelaksanaan T003 selesai; belum diimplementasikan atau diuji pada runtime**. Baseline produk D-01–D-10 disetujui; keputusan teknis di bawah adalah rancangan implementasi, bukan perubahan kebutuhan produk. Acuan: [PRD §8 dan §12](../PRD-v1.1.md), [stack](stack.md), [kontrak media](media-access.md).

**Pembaruan 31 Oktober 2026 — T010:** subset create/save draft artikel telah diimplementasikan dan diuji; kontrak workflow lengkap di bawah tetap target tugas lanjutan. `articles` menjadi Content, `article-revisions` menjadi Revision, dan `editorial-audit` mencatat command. Form Articles memakai field virtual editable untuk revisi kerja; generic mutation internal tetap tertutup, termasuk default Local API override. Hook domain menjadi jalur bersama form/REST. Perubahan owner/assignee Admin melewati jalur beraudit yang sama. Save saat ini hanya state draft; subset lain mengikuti T013–T025. Input tidak valid memakai 400 bawaan Payload, sedangkan objek tanpa izin 404 dan konflik versi 409. Audit saat ini dibaca Admin; histori Media mengikuti workflow lanjutan. Bukti transaksi/rollback dan lock ada di [laporan T010](../reports/T010.md).

## Keputusan dan alasan

Gunakan Payload 3.92.0 untuk akun, form/list CMS, validasi, access control dan adapter PostgreSQL. Gunakan layanan editorial kustom untuk state machine, revision pointer, submission, approval, audit dan referensi aset. Seluruh collection editorial memakai kontrak bersama; jenis konten menentukan schema payload dan relasi wajib/opsional.

Payload mendukung draft yang lebih baru daripada versi terbit, tetapi fasilitas itu sendiri tidak membuktikan aturan approval/aset/audit proyek. Karena itu status publik proyek tidak diturunkan dari `_status` atau tombol publish bawaan. Pilihan ini menambah collection internal dan tindakan Admin kustom, tetapi membuat objek yang disetujui eksplisit. Versions bawaan boleh menjadi histori tambahan setelah diuji; tidak menjadi sumber kebenaran kedua. Autosave tidak boleh mengubah submission terkunci. [Dokumentasi Drafts](https://payloadcms.com/docs/versions/drafts), diperiksa 23 Oktober 2026.

## Model logis dan invariant

Nama di tabel merupakan kontrak logis; nama collection/DDL final ditetapkan pada implementasi dan migration.

| Entitas | Data dan aturan |
|---|---|
| Content | ID stabil, jenis, createdBy, owner, assignedTo, slug, publicRevisionId nullable, workingRevisionId nullable, lockVersion integer. Maksimum satu revisi kerja; slug unik sesuai jenis dan terkunci setelah pertama terbit. |
| Revision | ID, contentId, nomor, state, editVersion, isi bertipe, metadata SEO, penulis publik, manifest aset, relasi target ID. State: draft/in_review/revision_required/published/archived. Revisi published dan archived tidak dapat diedit. |
| Submission | ID, revisionId, editVersion yang diajukan, manifest digest, status pending/approved/changes_requested/cancelled, actor/waktu. Maksimum satu pending per konten. Manifest menyebut assetId, fileVersion/hash dan alt/caption yang diulas. |
| Audit | ID, content/revision/submission bila relevan, action, before/after state, actor dari server, timestamp UTC, alasan, correlationId. Append-only; tidak memuat secret. |
| Asset / Usage | Identitas immutable file dan penggunaan di setiap revisi serta settings; rincian pada kontrak media. |
| Operational settings | Pointer periode aktif dan kampanye enabled, terpisah dari revisi. Target harus published; satu pointer per fungsi memastikan maksimum satu aktif. |

DB menegakkan foreign key dan keunikan revision number/pending submission, sementara mutation atomik menjaga pointer kerja/publik. Public pointer hanya boleh menunjuk revisi milik Content tersebut yang telah disetujui. Revision lama menjadi archived ketika digantikan; record dan audit dipertahankan. Publication state dihitung dari pointer, bukan dari keberadaan histori approval.

Konten draft belum lengkap boleh disimpan dengan validasi struktur/keamanan dan izin referensi; submit/publish menambahkan validasi seluruh field wajib. Client tidak dapat menentukan createdBy, actor, public pointer, approval, state, lock counter, atau ownership. Admin mengubah owner/assignee melalui tindakan khusus beraudit. Penulis publik terpisah dari akun.

## Transisi yang diizinkan

Setiap operasi menerima contentId, expectedLockVersion dan expectedRevisionId; aksi review juga menerima submissionId. Server mengambil actor dari sesi aktif, memeriksa origin/CSRF, role terkini dan izin. ID objek yang tidak boleh diakses menghasilkan 404; konflik objek berizin 409; input tidak valid 422. Pesan tidak mengungkap metadata privat pihak lain.

| Operasi | Syarat/pelaksana | Perubahan atomik |
|---|---|---|
| Create | Admin/Media aktif | Content dan Revision draft; owner/createdBy = actor, audit create. |
| Save | Admin atau owner/assignee; draft/revision_required | Validasi input/aset; update isi dan editVersion melalui compare-and-swap; audit perubahan tanpa menyalin data sensitif. |
| Submit / resubmit | Editor berizin, draft/revision_required, field lengkap | Bekukan isi/manifest, buat Submission baru pending, state in_review, audit. |
| Withdraw submission | Editor berizin, pending | Cancel submission; state draft; token lama tidak dapat dipakai, audit. |
| Request revision | Admin, pending, catatan wajib | Submission changes_requested, state revision_required, audit; edit baru memakai editVersion baru. |
| Approve/publish | Admin, pending yang masih cocok | Validasi ulang; submission approved, revisi published, public pointer diganti, working pointer kosong, revisi publik lama archived, usage publik diperbarui, audit dalam transaksi sama. |
| Create revision | Editor berizin; public pointer ada, working pointer kosong | Clone snapshot publik menjadi draft baru; public pointer tetap. Dua create bersamaan menghasilkan satu sukses dan satu konflik. |
| Archive working revision | Admin; draft/revision_required | State archived, working pointer kosong, audit; public pointer tetap. Review pending harus ditarik dahulu. |
| Withdraw publication | Admin, alasan wajib | Tolak bila ada relasi wajib dari publik; public pointer kosong, versi publik archived; cancel pending submission; working in_review kembali draft; nonaktifkan pointer operasional yang menunjuk item; update usages dan audit. |
| Restart archived | Admin | Buat draft baru dari histori jika working pointer kosong; tidak menerbitkan langsung. Revisi kerja yang disimpan saat penarikan boleh diajukan kembali dengan submission baru. |

Penghapusan permanen konten hanya Admin untuk draft yang belum pernah terbit dan tidak dirujuk; audit tombstone tetap ada tanpa FK cascading yang menghapus histori. Konten pernah terbit dan audit tidak dapat dihapus lewat CMS/API biasa.

## Batas API, CMS dan pembacaan publik

Seluruh mutasi dijalankan melalui satu layanan domain, dipakai custom endpoint dan tombol CMS. Generic REST/GraphQL collection internal menolak create/update/delete dari caller biasa, termasuk Admin; tombol tersembunyi bukan kontrol keamanan. GraphQL dinonaktifkan pada baseline bila belum dibutuhkan. Endpoint bawaan yang tetap aktif wajib melewati akses dan menolak protected fields/status mutation. History/version endpoints ikut pemeriksaan akses.

Untuk Local API atas nama pengguna, kirim actor dan `overrideAccess: false`. Payload Local API melewati access control secara default. Penulisan internal yang memerlukan privilege berada dalam fungsi server-only sempit, setelah otorisasi domain, dengan capability internal yang tidak bisa dibuat dari request body/context klien. Seed/setup merupakan jalur sistem terpisah, bukan endpoint publik. [Panduan Local API](https://payloadcms.com/docs/local-api/access-control), diperiksa 23 Oktober 2026.

Anonim hanya memakai public reader dengan allowlist: judul, slug, isi aman, metadata publik, tanggal dan penulis publik. Tidak ada owner, assignee, email, audit, draft, bukti izin privat atau submission. Count/search/pagination juga memfilter public pointer sebelum menghitung. Reader tidak mengembalikan serialized document CMS penuh.

Relasi disimpan sebagai target Content ID; public reader selalu mengambil public revision target saat request, bukan draft atau snapshot lama target. Relasi wajib tanpa target publik menahan publish; penarikan target ditolak ketika publik lain bergantung padanya. Relasi opsional ke target nonpublik dihilangkan. Preview memerlukan login aktif dan izin konten, mengirim no-store; tidak ada token preview publik.

## Transaksi, konflik dan kegagalan

Semua perubahan Content, Revision, Submission, Asset usage dan Audit dari satu command berada pada **satu transaksi PostgreSQL**. Propagasikan request/transaction yang sama ke operasi Payload terkait dan await seluruh penulisan. Payload mendukung transaksi dan propagasi lewat `req`; keberadaan beberapa Local API call sendiri tidak membuktikan atomicity. [Dokumentasi transaksi](https://payloadcms.com/docs/database/transactions), diperiksa 23 Oktober 2026.

Implementasi harus membuktikan lock/CAS dan predicate dependency check: kunci Content serta aset/target relasi yang terlibat dengan urutan ID tetap, atau gunakan isolation serializable dengan retry terbatas. Semua command publish/withdraw/revoke/settings memakai protokol sama, sehingga publish dependensi tidak dapat berlomba dengan withdraw target atau pencabutan aset. Jika adapter tidak menyediakan akses transaksi/locking yang cukup, hentikan fitur terkait dan tetapkan solusi adapter dalam lingkup tugas; jangan mengganti dengan read-then-write tanpa proteksi.

Recheck dalam transaksi: actor masih aktif/berizin, expected counters, submission pending, revision+editVersion+manifest sama, field wajib, slug, target publik, asset ready/izin/revoked, dan keberadaan blob/varian wajib. Approval lama atau dua keputusan bersamaan tidak boleh sama-sama berhasil. Update counter bersyarat yang memengaruhi nol row menghasilkan 409 dan rollback, bukan overwrite. Client reload sebelum mengulang aksi; respons yang hilang setelah commit diperiksa lewat submission/correlation ID sebelum mengirim ulang keputusan.

Blob disiapkan lengkap sebelum publish; tidak ada pemindahan file untuk menjadi publik saat commit. Gagal menulis audit atau usage membatalkan seluruh publish. Audit kegagalan operasional ke log aman terpisah setelah rollback; jangan mencatat approval sukses yang tidak commit. Blob rusak/hilang setelah commit menghasilkan fallback/penolakan file dan alert aman, bukan membuka jalur file lain.

## Cache dan konsistensi publik

Baseline MVP memakai dynamic server rendering, pembacaan DB setiap request, dan no-store untuk data/HTML/API/media yang dapat ditarik. Jangan memasukkan konten editorial ke Full Route Cache, ISR, shared fetch cache atau image optimizer Next. Metadata, sitemap, search/count dan nested relations memakai reader sama. Asset authorization selalu live. Jika kelak caching ditambahkan, perubahan itu wajib menyediakan protokol invalidasi yang lulus T018/T019 sebelum diaktifkan.

Mutasi sukses merefresh tampilan CMS/klien milik pelaku; route publik harus membaca ulang saat navigasi/refresh dan tidak memakai prefetch snapshot sebagai sumber kebenaran. Dokumen yang sudah ditampilkan atau byte yang sudah terkirim sebelum penarikan tidak dapat ditarik kembali. Request baru setelah commit wajib menolak versi/aset yang kehilangan izin. Baca halaman dari snapshot transaksi konsisten; jangan menggabungkan public pointer dari beberapa saat berbeda. Data waktu sensitif dihitung dari waktu server pada setiap request, disimpan UTC dan ditampilkan WIB; date-only tetap date-only.

## Supabase dan batas operasional

Gunakan proyek `lgqnxvldjqzgbfyxqonx` hanya melalui server adapter. Target rancangan: schema `payload` tidak diekspos Data API, role runtime terbatas dan role migration terpisah. `schemaName` adapter masih experimental menurut [dokumen Postgres](https://payloadcms.com/docs/database/postgres); buktikan migrasi dan nested operations pada T005/T006 sebelum mengandalkannya. Nonaktifkan schema push otomatis pada target hosted bersama; migration hanya menyentuh schema aplikasi. Bila private schema gagal, rancangan pengganti harus menutup grants/eksposur Data API sebelum tabel CMS dipakai.

Auth CMS dan Supabase Auth adalah domain berbeda; jangan memakai `auth.uid()` sebagai pengganti owner Payload. Runtime yang boleh membaca tabel tetap wajib menerapkan otorisasi CMS. Uji grants/exposed schemas dan akses anon/authenticated langsung, bukan hanya UI. [Keamanan Data API](https://supabase.com/docs/guides/api/securing-your-api). Target fixture/reset terpisah dari data kerja; role/schema aktual, TLS dan koneksi belum diverifikasi.

## Penelusuran skenario (review dokumen)

| Langkah | State/hasil yang diharapkan |
|---|---|
| Media A membuat artikel C, revisi R1 dan upload PDF P1 | Draft milik A; anonim/Media B tidak mendapat isi atau byte P1. |
| A submit S1; mencoba mengganti isi/P1 | R1 in_review terkunci, perubahan ditolak; Admin meminta revisi dengan catatan. |
| A memperbaiki lalu submit S2, Admin approve | S1 tak berlaku; R1 publik dengan manifest P1 dan audit; byte P1 boleh anonim. |
| A membuat revisi R2, memakai PDF baru P2 | R1/P1 tetap publik; P2 privat. Dua create R2 bersamaan menghasilkan satu working revision. |
| Admin approve S3 untuk R2, Admin lain memakai S2 | R2/P2 mengganti R1 secara utuh; S2 ditolak 409. P1 tertutup jika tidak ada pemakaian publik lain. |
| A membuat revisi R3 dan submit S4, lalu Admin withdraw publikasi R2 | C menjadi 404 di detail/API, hilang dari count/sitemap; S4 cancelled, R3 disimpan sebagai draft; P2 tertutup kecuali dipakai publik lain. |
| Admin mencoba approve S4 setelah withdraw | Ditolak; R3 harus submit baru. Relasi wajib yang masih menunjuk C menahan withdraw sampai dependensinya diselesaikan. |

Review awal ini memeriksa kontrak terhadap PRD. **Pembaruan T025, 31 Oktober 2026:** layanan nyata pada `src/editorial/commands.ts` memakai transaksi, manifest review dan lock graph; reader publik memakai approved snapshot, no-store dan DTO allowlist. `deletedAt` menyimpan tombstone tanpa menghapus audit. Konflik keputusan, audit restart, UI antrean/preview dan daftar/detail aman kini teruji bersama. [Laporan T025](../reports/T025.md) dan [matriks artikel](../qa/article-slice.md) mencatat bukti API/CMS/publik. Fase B selesai dan berhenti sebelum T026. SEO/sitemap T051 belum tersedia; withdrawal harus diuji ulang pada representasi tersebut ketika ditambahkan.

## Perluasan T026–T030

Pages memakai identitas homepage/about dan tabel revisi/review/audit tersendiri. Reader About memerlukan pointer publik dan keputusan approved pada versi yang sama; layout membaca DTO konfigurasi anonim pada waktu request. Periode/divisi memakai model editorial bersama dalam `reviewed-{model,hooks,commands}.ts`, dengan tabel revisi per jenis serta review/audit bersama yang mengikat kind, entityId, revisionId dan editVersion. Penunjuk operasional periode aktif tidak menjadi bagian model revisi (T032).

Label periode dan slug divisi merupakan identitas tetap. Tanggal periode adalah teks kalender tervalidasi, tidak bergeser karena UTC/WIB. Profil divisi memiliki relasi periode opsional yang harus terbit saat submit/publish. Semua revisi yang merujuk periode menahan penghapusan; dependensi yang masih terbit menahan withdrawal. Lihat [T029](../reports/T029.md) dan [T030](../reports/T030.md).

## Perluasan T031–T035

Members, Research Publications dan Events memakai engine reviewed yang sama; nama fisik review/audit serta endpoint command organization dipertahankan untuk kompatibilitas. Tabel revisi per jenis menjaga pointer dan sejarah, sedangkan manifest mengikat isi, editVersion serta versi/checksum file. Tombstone hanya tersedia bagi draft non-divisi tanpa sejarah approved, pending review atau dependensi. Media dapat membuat draft miliknya; penugasan, taksonomi dan keputusan publikasi tetap Admin.

Members wajib merujuk periode terbit dan boleh tanpa divisi. Reader struktur memilih periode aktif atau arsip, mengambil foto dalam query gabungan, dan mengeluarkan DTO anonim tanpa akun CMS. Dependensi pengurus kini ikut menahan penarikan/penghapusan periode. Global organization-state memakai satu pointer, expectedVersion, lock graph dan audit atomik; withdrawal yang sah mengosongkannya dalam transaksi yang sama.

Riset memiliki tanggal analisis kalender, kategori Admin, sumber HTTPS, tim publik serta disclaimer dasar tetap. Payload menyaring field update:false sebelum hook; hook mempertahankan kategori Admin saat Media menyimpan formulir penuh, serta menolak penggantian kategori. Event memakai input WIB eksplisit dan penyimpanan ISO UTC; status dan CTA dihitung pada request server. Konfirmasi URL pendaftaran hanya Admin dan dibatalkan saat Media mengubah URL. Reader event tersedia sebagai API; HTML kegiatan mengikuti T036.

## Perluasan T036–T042

Rekrutmen memperluas engine reviewed melalui recruitment-periods/recruitment-revisions, posisi dan tahapan bertingkat. Manifest mengikat seluruh isi, termasuk konfirmasi URL, sedangkan global recruitment-state menyimpan satu pointer enabledCampaign yang menentukan enabledByAdmin. Admin wajib menonaktifkan kampanye lama dahulu; expectedVersion, lock graph dan indeks singleton melindungi request bersamaan. Withdrawal menonaktifkan pointer dan mencatat audit dalam transaksi yang sama. Waktu tutup tidak mengubah pointer. Periode wajib dan divisi posisi yang diisi harus terbit; dependensi menahan withdrawal target.

Reader publik kegiatan/rekrutmen, homepage dan publikasi memakai approved snapshot. Homepage menggabungkan Pages homepage/About, tiga artikel dan riset terbaru, serta tiga event mendatang terdekat. Program berasal dari blok Pages; prestasi/mitra belum tersedia. ContactLinks dan publicSettings menjaga satu sumber untuk halaman kontak/footer.

LiveRegistration hanya mengekspos CTA setelah revalidasi API no-store. Server menghitung status dan deadline berikut; klien memakai jam monotonic serta mengurangi keseluruhan durasi request secara konservatif. Pada deadline link ditutup sebelum refetch, juga diperiksa saat klik serta pemulihan tab/history. Refresh gagal menutup CTA; perubahan operasional direvalidasi maksimal 30 detik. Jam kalender browser dan query URL tidak mengatur waktu server. Link yang sudah disalin tidak dapat ditarik dari penyedia formulir eksternal; aplikasi mengendalikan penampilan CTA-nya.
