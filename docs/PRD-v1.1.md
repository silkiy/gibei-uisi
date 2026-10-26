# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## GIBEI UISI Official Website & CMS

**Organisasi:** Galeri Investasi Bursa Efek Indonesia – Universitas Internasional Semen Indonesia (GIBEI UISI)  
**Versi:** 1.1  
**Tanggal:** 20 Oktober 2026  
**Status:** Baseline pengembangan localhost disetujui pemilik proyek pada 23 Oktober 2026; validasi konten resmi dan produksi tetap terbuka  
**Platform:** Web responsif + CMS  
**Stack target:** Next.js App Router, React, TypeScript, Payload CMS, PostgreSQL, Tailwind CSS  
**Lingkungan awal:** Localhost  
**Dasar dokumen:** PRD v1.0 tanggal 20 Oktober 2026 yang disediakan pemilik proyek.

### Kedudukan dan perubahan versi

Dokumen ini menggantikan PRD v1.0 sebagai acuan pengembangan. Paket keputusan D-01–D-10, termasuk kebijakan yang semula bertanda **Usulan baseline v1.1**, telah disetujui pemilik proyek melalui persetujuan T001 pada 23 Oktober 2026. Label usulan pada uraian di bawah dipertahankan sebagai penanda asal revisi; status terkini mengikuti §18 dan [register keputusan](decisions.md). Implementasi harus mencatat penyimpangan yang disepakati. Persetujuan baseline tidak menggantikan validasi materi resmi atau persetujuan deployment oleh organisasi.

Perubahan utama:

- Memperjelas cakupan MVP, prioritas P0/P1, dan batas demo awal.
- Menambahkan matriks izin, kepemilikan, dan penugasan konten.
- Mengikat pengajuan serta persetujuan pada versi konten tertentu.
- Menetapkan usulan kebijakan revisi publikasi tanpa mengubah versi publik sebelum persetujuan.
- Menambahkan kebijakan akses media draft, penarikan publikasi, dan penghapusan aset.
- Membedakan arsip periode kepengurusan dari konten yang ditarik.
- Menambahkan aturan waktu, validasi tautan, seed data, dan kriteria pengujian.

---

## 1. Executive Summary

GIBEI UISI Official Website menjadi pusat informasi resmi organisasi, edukasi investasi, riset pasar modal, kegiatan, rekrutmen, prestasi, dan kerja sama.

Sistem terdiri atas website publik tanpa login pengunjung dan CMS untuk Admin serta Media Communication. Website melengkapi Instagram **@gibei.uisi**. Pengembangan awal dilakukan secara lokal untuk demonstrasi kepada UISI sebelum menentukan domain dan infrastruktur produksi.

MVP berfokus pada publikasi organisasi yang mudah dikelola, memiliki kontrol editorial, dan dapat dipindahkan ke lingkungan produksi. Sistem operasional internal organisasi berada di luar cakupan.

## 2. Background & Problem Statement

- **P1 — Informasi tersebar:** profil, kepengurusan, program kerja, dan kegiatan belum terpusat.
- **P2 — Publikasi belum terstruktur:** edukasi, riset, dan dokumentasi membutuhkan pencarian, pengarsipan, dan pembaruan yang konsisten.
- **P3 — Kredibilitas digital:** organisasi membutuhkan rujukan resmi bagi mahasiswa, publik, dan calon mitra.

## 3. Product Goals & Success Criteria

Tujuan produk:

1. Menyediakan pusat informasi resmi GIBEI UISI.
2. Memudahkan pencarian profil, program kerja, publikasi, dan kegiatan.
3. Memungkinkan Media Communication menyiapkan konten melalui CMS.
4. Menempatkan persetujuan akhir pada Admin.
5. Mendukung pergantian kepengurusan tanpa kehilangan riwayat.
6. Menghasilkan prototipe localhost yang dapat dijalankan ulang dan dipersiapkan untuk produksi.

Indikator kelulusan MVP:

- Sebelas modul publik pada §5 tersedia dan berfungsi.
- Delapan divisi memiliki profil dan program kerja; informasi contoh diberi label.
- Alur pembuatan, pengajuan, revisi, persetujuan, dan penarikan dapat didemonstrasikan menggunakan kedua peran.
- Konten yang belum disetujui tidak terungkap lewat halaman publik, API, pencarian, metadata, atau file media.
- Halaman utama dapat digunakan pada perangkat mobile dan keyboard.
- Dokumentasi memungkinkan pengembang lain menjalankan demo lokal.

Target trafik dan engagement ditentukan setelah tersedia data operasional; bukan syarat kelulusan demo lokal.

## 4. Target Users

| Pengguna | Kebutuhan utama | Akses |
|---|---|---|
| Public Visitor | Membaca informasi, publikasi, kegiatan, rekrutmen, dan kontak | Website publik tanpa akun |
| Media Communication | Menyiapkan konten, upload, mengajukan review, dan memperbaiki revisi | CMS dengan izin terbatas |
| Admin | Mengelola akun, meninjau, menerbitkan, menarik konten, dan mengatur website | CMS sesuai matriks izin |
| Divisi lainnya | Menyediakan materi melalui koordinasi internal | Tidak memiliki akun CMS pada MVP |

Tidak ada pendaftaran akun publik atau portal pengajuan materi antar divisi pada MVP.

## 5. Product Scope & Priorities

### 5.1 Sebelas modul publik

| ID | Modul | Prioritas pengerjaan |
|---|---|---|
| FR-01 | Homepage | P0 |
| FR-02 | Tentang GIBEI UISI | P0 |
| FR-03 | Struktur organisasi dan delapan divisi | P0 |
| FR-04 | Artikel dan edukasi investasi | P0 |
| FR-05 | Riset dan market insight | P0 |
| FR-06 | Event dan kegiatan | P0 |
| FR-07 | Galeri dokumentasi | P1 |
| FR-08 | Open Recruitment | P0 |
| FR-09 | Partnership | P1 |
| FR-10 | Kontak dan media sosial | P0 |
| FR-11 | Prestasi dan pencapaian | P1 |

**Usulan baseline v1.1:** P0 dan P1 menunjukkan urutan pengerjaan. Keduanya wajib untuk MVP lengkap. Demo antara yang hanya mencakup P0 harus disebut **demo parsial**, bukan MVP selesai. Pengurangan cakupan memerlukan perubahan PRD dan Definition of Done.

### 5.2 Kemampuan CMS yang termasuk MVP

- Login Admin dan Media Communication, pengelolaan akun oleh Admin.
- CRUD konten sesuai izin, rich text, pencarian/filter CMS, dan pagination daftar.
- Media library gambar dan PDF dengan kontrol akses.
- Draft, review, catatan revisi, penerbitan, penarikan, dan riwayat versi.
- Pengelolaan halaman, pengurus, divisi, mitra, prestasi, dan periode rekrutmen.
- Pengaturan identitas website, navigasi, footer, kontak, dan SEO.
- Seed data, panduan instalasi, serta demo localhost.

### 5.3 Di luar MVP

Sistem keuangan Treasurer, LPJ/RDIS, database anggota internal, penilaian pengurus, pengajuan desain antar divisi, formulir pendaftaran internal, perdagangan saham, harga saham real-time, rekomendasi investasi otomatis, pembayaran, aplikasi mobile native, dan integrasi Instagram otomatis.

## 6. Information Architecture & Sitemap

### 6.1 Website publik

| Rute | Isi |
|---|---|
| `/` | Hero, profil singkat, program unggulan, publikasi terbaru, event, prestasi, mitra, CTA |
| `/tentang` | Profil, sejarah, visi, misi, dan ringkasan organisasi |
| `/tentang/struktur` | Kepengurusan berdasarkan periode dan akses riwayat periode |
| `/tentang/divisi` | Daftar delapan divisi |
| `/tentang/divisi/[slug]` | Profil, program kerja, dan pengurus divisi |
| `/publikasi` | Pintu masuk artikel dan riset |
| `/publikasi/artikel` | Artikel, pencarian, kategori, dan pagination |
| `/publikasi/artikel/[slug]` | Detail artikel |
| `/publikasi/riset` | Riset, pencarian, kategori, dan pagination |
| `/publikasi/riset/[slug]` | Detail riset dan lampiran yang disetujui |
| `/kegiatan` | Event mendatang, berlangsung, dan selesai |
| `/kegiatan/[slug]` | Detail event dan pendaftaran jika tersedia |
| `/galeri` | Daftar album dokumentasi |
| `/galeri/[slug]` | Detail album dan tautan video |
| `/rekrutmen` | Periode aktif atau informasi belum dibuka/ditutup |
| `/partnership` | Mitra dan kolaborasi |
| `/prestasi` | Pencapaian dengan filter tahun |
| `/kontak` | Kontak terkonfirmasi dan tautan sosial |

Rute di atas adalah usulan baseline. Perubahan nama rute harus menjaga navigasi dan tautan internal tetap konsisten. Sebelas modul tidak berarti hanya sebelas URL.

### 6.2 CMS

Overview; Pages; Articles; Research Publications; Events; Galleries; Recruitment Periods; Organizational Periods; Divisions; Members; Partners; Achievements; Media; antrean review dan riwayat keputusan; Users; Site Settings.

Antrean review dapat berupa tampilan terfilter pada CMS. Tidak wajib membangun aplikasi dashboard terpisah dari Payload Admin.

## 7. Functional Requirements — Public Website

### FR-01 Homepage — P0

- Menampilkan identitas, profil singkat, program unggulan, artikel dan riset terbaru, event, prestasi, mitra, serta CTA.
- Urutan/isi bagian editorial dapat diubah melalui CMS.
- Daftar terbaru berasal dari versi terbit, dengan urutan tanggal publikasi; event mendatang mengikuti waktu mulai terdekat.
- Bagian tanpa data menampilkan empty state yang relevan atau disembunyikan tanpa merusak tata letak.
- Tidak menampilkan angka prestasi, statistik, atau mitra yang belum diverifikasi sebagai fakta resmi.

### FR-02 Tentang GIBEI — P0

- Menampilkan profil, sejarah, visi, misi, dan gambar yang dapat dikelola melalui CMS.
- Halaman dapat dibaca tanpa login serta memiliki judul dan deskripsi SEO.
- Konten yang belum dikonfirmasi ditandai sebagai contoh pada demo.

### FR-03 Struktur organisasi dan divisi — P0

Delapan divisi: Secretary, Treasurer, Strategy, Research, Human Resource, Partnership, Event Organizer, dan Media Communication.

- Setiap divisi memiliki nama, deskripsi, program kerja, dan urutan tampilan.
- Setiap pengurus memiliki nama, jabatan, periode, divisi jika relevan, foto opsional, dan urutan tampilan.
- Jabatan lintas divisi dapat memiliki relasi divisi kosong dan tampil pada tingkat organisasi.
- Pergantian periode tidak menimpa pengurus periode sebelumnya.
- **Usulan baseline v1.1:** maksimum satu periode menjadi periode aktif. Periode selesai tetap dapat dibaca publik jika informasinya telah disetujui. Aktivasi operasional terpisah dari isi editorial dan mengikuti §8.8.
- Status periode `current`/`past` tidak sama dengan tindakan menarik konten dari publik.
- Persyaratan khusus posisi dikelola di rekrutmen, bukan wajib ditampilkan pada profil divisi.

### FR-04 Artikel dan edukasi investasi — P0

- Daftar dan detail memuat judul, slug unik per jenis konten, excerpt, kategori, sampul opsional, penulis publik, tanggal publikasi, rich text, sumber, dan disclaimer bila relevan.
- Penulis publik dapat berupa nama tim; identitas akun CMS tidak otomatis dipublikasikan.
- Pencarian mencakup judul dan excerpt; filter kategori dapat digabung dengan pencarian dan pagination.
- Hasil kosong, parameter tidak valid, dan halaman di luar rentang ditangani secara konsisten.
- Draft dan versi revisi tidak masuk hasil, jumlah hasil, atau metadata publik.

### FR-05 Riset dan market insight — P0

- Mendukung kategori Capital Market Explained, Equity Snapshot, Insight Talks, Stock Watchlist, serta kategori analisis yang dikelola Admin.
- Memuat judul, slug, kategori, tim/penulis publik, tanggal analisis, ringkasan, rich text, sampul opsional, sumber, dan PDF opsional.
- Tanggal analisis dibedakan dari tanggal publikasi dan terlihat pada detail.
- Disclaimer dasar wajib ditampilkan oleh template dan tidak dapat dihapus oleh editor. Catatan khusus dapat ditambahkan tanpa menggantikan disclaimer dasar.
- Usulan teks dasar: “Publikasi ini untuk edukasi dan informasi, bukan rekomendasi membeli atau menjual efek. Analisis mencerminkan kondisi pada tanggal yang dicantumkan. Keputusan investasi dan risikonya menjadi tanggung jawab masing-masing.”
- PDF yang disajikan harus merupakan lampiran yang disetujui bersama versi riset tersebut.

### FR-06 Event dan kegiatan — P0

- Memuat judul, slug, deskripsi, poster opsional, waktu mulai/selesai, lokasi atau kanal online, penyelenggara, status pendaftaran, dan URL eksternal opsional.
- **Usulan baseline v1.1:** status waktu dihitung otomatis: upcoming sebelum mulai, ongoing sejak mulai sampai sebelum selesai, completed sejak waktu selesai. Event batal memakai penanda terpisah `cancelled`.
- Waktu selesai wajib lebih besar dari waktu mulai. Event batal tetap dapat dibaca dengan keterangan pembatalan.
- Tombol daftar tampil hanya jika versi terbit, status pendaftaran terbuka, event belum selesai/tidak batal, URL valid dan terkonfirmasi, serta masih dalam jendela pendaftaran jika diisi.
- Event selesai tetap tersedia sebagai dokumentasi publik, kecuali ditarik secara eksplisit.
- Semua aturan waktu mengikuti §8.8.

### FR-07 Galeri dokumentasi — P1

- Album memiliki judul, slug, deskripsi, tanggal kegiatan, relasi event opsional, daftar foto, dan tautan video opsional.
- Foto informatif memiliki alt text; caption dapat diisi terpisah.
- Album dan file foto hanya terbuka setelah mendapat persetujuan publikasi.
- Video berupa tautan eksternal valid; upload video dan embed pihak ketiga tidak wajib pada MVP.

### FR-08 Open Recruitment — P0

- Memuat judul, periode kepengurusan tujuan, deskripsi, posisi, relasi divisi, persyaratan per posisi, tahapan seleksi, waktu buka/tutup, dan URL pendaftaran eksternal.
- **Usulan baseline v1.1:** maksimum satu kampanye memiliki `enabledByAdmin=true`, termasuk kampanye mendatang atau yang waktunya sudah berakhir. Kampanye hanya menerima pendaftaran jika terbit, diaktifkan Admin, dan berada dalam rentang waktu buka/tutup. Definisi aktivasi mengikuti §8.8.
- Rentang berlaku sejak waktu buka, hingga sebelum waktu tutup. Waktu tutup wajib sesudah waktu buka.
- Tombol daftar hanya tampil jika seluruh kondisi tersebut terpenuhi dan URL telah dikonfirmasi.
- Di luar rentang waktu tampil status belum dibuka atau ditutup. URL tersimpan tidak cukup untuk memunculkan tombol.
- Periode sebelumnya tetap tersedia sebagai informasi riwayat jika disetujui; tidak memiliki tombol pendaftaran aktif.

### FR-09 Partnership — P1

- Memuat nama, logo opsional, deskripsi, jenis kolaborasi, website opsional, dan pilihan tampil di homepage.
- Logo ditampilkan hanya jika izin penggunaannya tercatat oleh Admin. Tanpa izin, identitas visual tidak ditampilkan; nama/deskripsi juga harus telah disetujui.
- Informasi contoh tidak boleh menyiratkan adanya kerja sama resmi.

### FR-10 Kontak dan media sosial — P0

- Menampilkan hanya email, Instagram, sosial, dan lokasi yang telah dikonfirmasi.
- Seluruh komponen menggunakan sumber kontak yang sama dari Site Settings.
- Kolom yang belum terkonfirmasi boleh kosong dan tidak ditampilkan sebagai kontak resmi.
- Tidak ada formulir kontak, penyimpanan pesan, atau pengiriman email otomatis pada MVP.

### FR-11 Prestasi dan pencapaian — P1

- Memuat judul, kategori, tanggal, deskripsi, penerima/tim jika relevan, dan dokumentasi opsional.
- Mendukung pengelompokan/filter tahun.
- Dapat direvisi melalui review dan ditarik dari publik tanpa menghapus riwayat keputusan.

## 8. CMS Requirements & Editorial Policy

### 8.1 Roles and permissions

**Usulan baseline v1.1:** hanya dua peran CMS: `admin` dan `media`. Tidak ada self-registration CMS. Tabel berikut berlaku pada UI, API, dan operasi server yang bertindak atas nama pengguna.

| Operasi | Public | Media Communication | Admin |
|---|---|---|---|
| Membaca versi publik dan aset yang diizinkan | Ya | Ya | Ya |
| Masuk CMS | Tidak | Akun aktif | Akun aktif |
| Membaca draft/revisi | Tidak | Milik sendiri atau ditugaskan | Semua |
| Membuat draft konten editorial | Tidak | Ya | Ya |
| Mengedit draft/revision_required | Tidak | Milik sendiri atau ditugaskan | Semua |
| Mengubah isi versi in_review | Tidak | Tidak; tarik pengajuan dahulu | Tidak; kembalikan ke revisi dahulu |
| Mengajukan atau menarik pengajuan | Tidak | Milik sendiri atau ditugaskan | Semua |
| Meminta revisi dan memberikan keputusan akhir | Tidak | Tidak | Ya |
| Menerbitkan atau menarik publikasi | Tidak | Tidak | Ya |
| Membuat revisi dari versi terbit | Tidak | Milik sendiri atau ditugaskan | Semua |
| Mengatur owner, assignee, dan kategori | Tidak | Tidak | Ya |
| Upload gambar/PDF | Tidak | Ya, ke area privat | Ya, ke area privat |
| Mengedit metadata media privat | Tidak | Milik sendiri atau ditugaskan | Semua |
| Menghapus draft/media | Tidak | Tidak pada MVP | Sesuai §8.5 dan §8.6 |
| Membaca audit editorial | Tidak | Riwayat konten yang boleh diakses | Semua |
| Mengubah/menghapus catatan audit | Tidak | Tidak | Tidak melalui CMS/API biasa |
| Mengelola akun, role, dan status akun | Tidak | Tidak | Ya |
| Mengubah Site Settings, navigasi, dan footer | Tidak | Tidak | Ya, tercatat dalam audit |

Konten editorial meliputi Pages, Articles, Research Publications, Events, Galleries, Recruitment Periods, Organizational Periods, Divisions, Members, Partners, dan Achievements. Profil serta program divisi mengikuti review yang sama. Pengaktifan rekrutmen dan pemilihan periode organisasi aktif hanya oleh Admin.

Halaman homepage dan tentang disimpan sebagai konten editorial. Site Settings menyimpan konfigurasi situs, bukan salinan isi halaman. Perubahan konfigurasi oleh Admin berlaku setelah disimpan dan dicatat; tidak membutuhkan persetujuan Admin kedua.

### 8.2 Kepemilikan, penugasan, dan akun

- `createdBy` ditetapkan server saat pembuatan dan tidak dapat diubah oleh editor.
- `owner` awal adalah pembuat; Admin dapat memindahkan owner dan mengatur `assignedTo`.
- Media dapat mengakses konten jika menjadi owner atau termasuk assignee. Relasi ini tidak memberi hak menerbitkan.
- Owner/assignee tidak boleh ditentukan sendiri melalui manipulasi request.
- Nama penulis publik terpisah dari owner, assignee, dan email akun.
- Akun memiliki status aktif/nonaktif. Setiap akses terautentikasi memeriksa status terkini; akun nonaktif ditolak meskipun sebelumnya sudah login.
- Tidak boleh menonaktifkan, menghapus, atau menurunkan role Admin aktif terakhir.
- Akun yang memiliki riwayat editorial dinonaktifkan; penghapusan permanen bukan fitur MVP.
- Admin awal dibuat melalui proses setup yang terdokumentasi dan tidak tersedia sebagai endpoint pendaftaran publik tanpa perlindungan.
- Password reset pada localhost dapat dilakukan oleh Admin. Pengiriman email pemulihan otomatis tidak wajib untuk demo dan harus diputuskan sebelum produksi.

### 8.3 Model versi dan keterlihatan publik

**Usulan baseline v1.1:** persetujuan sekaligus menerbitkan versi yang ditinjau. Tidak ada status `approved` terpisah, penjadwalan publikasi, atau persetujuan dua Admin pada MVP. Admin boleh menyetujui materi yang dibuatnya sendiri; tindakan tetap tercatat.

- Status editorial sebuah versi: `draft`, `in_review`, `revision_required`, `published`, atau `archived`.
- Satu item konten dapat memiliki versi publik dan satu revisi kerja aktif secara bersamaan.
- Website publik membaca versi yang terakhir disetujui dan masih diizinkan tampil, bukan otomatis versi tersimpan paling baru.
- Edit konten terbit membuat revisi kerja. Judul, slug, isi, metadata, relasi, dan aset versi publik tetap sama sampai revisi disetujui.
- Pengajuan menyimpan identitas versi dan aset yang akan ditinjau. Isi versi `in_review` dikunci.
- Keputusan hanya sah terhadap versi yang diajukan dan belum berubah. Pengajuan yang kedaluwarsa atau berbenturan dengan perubahan lain harus ditolak dengan pesan yang jelas.
- Persetujuan revisi mengganti versi publik secara utuh. Kegagalan proses tidak boleh menghasilkan campuran isi lama dan baru atau publikasi tanpa audit.
- Untuk MVP, slug dikunci setelah publikasi pertama. Perubahan URL dan redirect bukan bagian dari alur edit biasa.
- Detail konten tanpa versi publik mengembalikan 404 kepada pengunjung. Preview privat memerlukan login dan izin yang sesuai, tanpa tautan preview publik pada MVP.

### 8.4 Transisi dan audit review

| Dari | Tindakan | Menjadi | Pelaksana | Ketentuan |
|---|---|---|---|---|
| Belum ada | Buat | draft | Admin/Media | Owner ditetapkan server |
| draft | Ajukan | in_review | Admin/Media berizin | Field wajib valid; versi dan aset dibekukan |
| revision_required | Ajukan ulang | in_review | Admin/Media berizin | Perbaikan tersimpan sebagai versi yang ditinjau |
| in_review | Tarik pengajuan | draft | Admin/Media berizin | Keputusan lama tidak dapat dipakai |
| in_review | Minta revisi | revision_required | Admin | Catatan revisi wajib |
| in_review | Setujui dan terbitkan | published | Admin | Versi cocok; seluruh validasi publikasi lulus |
| published | Buat revisi | draft baru | Admin/Media berizin | Versi publik sebelumnya tetap tampil |
| published | Tarik publikasi | archived | Admin | Alasan wajib; versi tidak lagi publik |
| draft/revision_required | Arsipkan revisi | archived | Admin | Tidak otomatis menarik versi publik sebelumnya |
| archived | Mulai ulang | draft baru | Admin | Tidak menerbitkan ulang secara langsung |

Pengarsipan versi yang sedang direview memerlukan pembatalan pengajuan terlebih dahulu. Penarikan publikasi membatalkan pengajuan revisi yang masih menunggu; revisi kerja disimpan tetapi harus diajukan ulang untuk menerbitkan kembali.

Audit mencatat: jenis konten, ID konten, identitas versi, tindakan, status sebelum/sesudah, pelaksana, waktu, serta catatan/alasan. Catatan review dibuat server, tidak dapat dipalsukan menggunakan field dari klien, dan tidak terbuka bagi publik.

Audit mencakup perubahan role/status akun, konfigurasi situs, penugasan, pengaktifan rekrutmen/periode, dan keputusan media. Riwayat tidak menyimpan password, token, atau secret.

### 8.5 Penarikan publikasi dan arsip

- Penarikan publikasi menyembunyikan item dari daftar, detail, pencarian, sitemap, metadata, serta API publik. URL detail menjadi 404.
- Tindakan selesai hanya setelah seluruh representasi yang dikelola aplikasi, termasuk cache publik dan akses aset terkait, diperbarui secara konsisten.
- Periode kepengurusan lampau, event selesai, dan rekrutmen ditutup tetap dapat dibaca jika masih diterbitkan; perubahan status bisnis tidak otomatis menarik konten.
- Konten terbit dan auditnya tidak dapat dihapus permanen melalui CMS biasa pada MVP.
- Draft yang belum pernah terbit boleh dihapus Admin jika tidak dirujuk konten lain. Kejadian penghapusan dicatat tanpa menghilangkan audit sebelumnya.
- Penarikan tidak dapat menghapus salinan file yang sebelumnya sudah diunduh pihak lain.
- Penarikan target relasi wajib ditolak jika masih dirujuk konten publik lain. CMS menampilkan dependensi; Admin terlebih dahulu menerbitkan pengganti relasi yang sah atau menarik konten dependen. Relasi opsional ke target yang ditarik tidak dirender. Tidak ada penarikan berantai otomatis pada MVP.

### 8.6 Media library dan perlindungan file

**Usulan baseline v1.1:** upload bersifat privat sampai disetujui untuk penggunaan publik. Semua aset yang disajikan aplikasi harus mengikuti pemeriksaan izin, termasuk URL file asli, thumbnail, hasil transformasi, dan unduhan PDF.

- Media privat dapat dilihat pemilik/assignee yang berizin serta Admin. Draft tidak boleh bocor melalui direktori statis yang dapat diakses tanpa pemeriksaan.
- Pemilihan, penyimpanan, pengajuan, dan persetujuan referensi aset memeriksa izin server. Media tidak dapat memasukkan ID aset privat pengguna lain tanpa penugasan, termasuk lewat request API. Aset yang sudah publik boleh digunakan ulang; jika aksesnya dicabut sebelum persetujuan, publikasi baru ditolak sampai referensinya diperbaiki.
- Persetujuan konten mencakup daftar aset dan versi file yang dipakai. Aset yang belum disetujui tidak boleh ditautkan dari konten terbit.
- File yang sudah disetujui tidak boleh ditimpa byte-nya. Penggantian gambar/PDF membuat aset baru dan mengikuti review.
- Perubahan alt/caption yang sudah tampil publik mengikuti review konten; tidak mengubah tampilan versi terbit secara diam-diam.
- Aset yang disetujui dapat digunakan ulang. Akses publik berlaku selama aset masih dirujuk setidaknya satu versi yang terbit atau konfigurasi situs aktif yang disetujui Admin.
- Menarik satu konten tidak menutup aset yang masih dipakai konten publik lain. Jika tidak ada referensi publik tersisa, akses publik aset dicabut, termasuk turunannya.
- Admin dapat mencabut aset secara darurat. Aplikasi harus menolak penyajiannya dan menampilkan fallback pada konten yang masih merujuk, serta menunjukkan daftar konten terdampak di CMS.
- Penghapusan permanen hanya oleh Admin untuk aset tanpa referensi konten, revisi tersimpan, maupun konfigurasi. Jika masih dirujuk, operasi ditolak dan referensi ditampilkan.
- Dokumen internal, data sensitif, serta data pribadi tanpa otorisasi tidak dimasukkan ke seed atau media publik.

Validasi upload awal yang diusulkan:

| Jenis | Format | Ukuran maksimum per file | Ketentuan |
|---|---|---|---|
| Gambar | JPEG, PNG, WebP | 5 MiB | Maksimum 25 megapiksel; alt wajib untuk gambar informatif |
| Dokumen | PDF | 15 MiB | Nama tampilan jelas; disajikan sebagai unduhan |

Validasi server memeriksa ukuran, ekstensi, MIME, dan signature file. SVG, HTML, executable, arsip, serta format lain ditolak pada MVP. Upload gagal tidak meninggalkan file yatim yang dapat diakses publik. File disimpan dengan nama internal yang aman; nama asli tidak digunakan sebagai path penyimpanan.

Logo/favicon situs diunggah privat lalu diizinkan untuk publik melalui tindakan Admin saat konfigurasi disimpan. Favicon memakai format gambar yang didukung pada tabel di atas.

### 8.7 Site Settings dan konten halaman

- Admin mengelola nama situs, logo, favicon, deskripsi SEO default, kontak terkonfirmasi, sosial, navigasi, dan footer.
- Homepage dan About Page dikelola lewat Pages dengan identitas halaman tetap agar tidak ada dua sumber isi yang saling bertentangan.
- URL navigasi internal harus menunjuk rute yang didukung; eksternal mengikuti validasi §8.8.
- Media mengelola isi halaman yang ditugaskan melalui review; tidak mengubah konfigurasi global.

### 8.8 Waktu, tautan, dan aturan lintas modul

- Zona waktu organisasi adalah **Asia/Jakarta**. CMS menampilkan zona waktu input dengan jelas; timestamp disimpan secara konsisten dalam UTC dan ditampilkan dalam WIB.
- Tanggal kalender seperti tanggal analisis, tanggal prestasi, dan tanggal album tidak boleh bergeser hari akibat konversi zona waktu.
- Aturan buka/tutup memakai waktu server dan tetap berlaku ketika halaman di-cache. Uji dilakukan tepat sebelum, saat, dan sesudah batas waktu.
- Tautan web eksternal hanya menerima HTTPS yang valid. Skema `javascript:`, `data:`, dan URL tidak valid ditolak. `mailto:` hanya digunakan untuk email terkonfirmasi.
- Tautan yang membuka tab baru memakai perlindungan relasi yang sesuai. Rich text tidak boleh menyisipkan script, HTML berbahaya, atau iframe bebas.
- Validitas sintaks URL berbeda dari konfirmasi tujuan. Admin memeriksa tujuan tautan pendaftaran sebelum menerbitkan; sistem tidak wajib melakukan pengecekan ketersediaan layanan pihak ketiga secara otomatis.
- Pagination publik default 12 item, maksimum 48 per halaman. Pencarian judul/ringkasan tidak membedakan huruf besar-kecil. Kategori tidak dikenal menghasilkan hasil kosong; parameter pagination tidak valid kembali ke nilai default; halaman valid di luar rentang menampilkan empty state.
- Tindakan bersamaan tidak boleh menyebabkan persetujuan versi usang atau hilangnya edit tanpa pemberitahuan konflik.
- Pemilihan periode organisasi aktif dan `enabledByAdmin` rekrutmen merupakan konfigurasi operasional oleh Admin, terpisah dari isi versi editorial. Target hanya boleh konten yang sedang terbit. Perubahan ini berlaku langsung, dicatat dalam audit, dan tidak menerbitkan isi draft/revisi.
- Maksimum satu periode organisasi aktif. Menarik periode aktif, setelah dependensi wajib diselesaikan, mengosongkan pilihan aktif; halaman menampilkan bahwa periode aktif belum ditetapkan sampai Admin memilih periode terbit lain.
- Maksimum satu kampanye memiliki `enabledByAdmin=true`, tanpa bergantung pada rentang tanggalnya. Untuk mengaktifkan kampanye berikutnya, Admin menonaktifkan yang lama terlebih dahulu. Menarik kampanye otomatis menonaktifkannya. Melewati waktu tutup menghilangkan CTA tetapi tidak otomatis mengubah flag tersebut. Rentang kampanye nonaktif boleh tumpang tindih karena tidak dapat menerima pendaftaran bersamaan.

## 9. Content Ownership per Division

| Divisi | Materi yang disediakan |
|---|---|
| Secretary | Profil organisasi, administrasi informasi, dokumen publik yang disetujui |
| Treasurer | Program kerja yang layak dipublikasikan; bukan data keuangan internal |
| Strategy | Stock Watchlist, Investment Class, market insight |
| Research | Equity Snapshot, Capital Market Explained, Insight Talks |
| Human Resource | Rekrutmen dan informasi kepengurusan publik |
| Partnership | Mitra, kerja sama, kunjungan, dan bukti izin logo |
| Event Organizer | Jadwal, poster, detail kegiatan, dan status pendaftaran |
| Media Communication | Penyiapan konten digital, pengajuan review, dan revisi |

Materi diserahkan melalui koordinasi internal yang sudah berlaku. **Admin bertanggung jawab atas persetujuan dan penerbitan akhir.** Pemetaan divisi penyedia materi bukan pemberian akses CMS kepada divisi tersebut.

## 10. UI/UX Requirements

- Arah awal: hijau dominan, hijau terang sebagai aksen, putih/netral untuk keterbacaan, tipografi modern, dan foto kegiatan yang sah digunakan.
- HEX, font, dan logo final menunggu brand guideline. Identitas sementara diberi keterangan pada dokumentasi demo.
- Desain memiliki arah visual yang disengaja, hierarki editorial yang jelas, dan tidak bergantung pada komponen dekoratif generik.
- Mobile-first: mobile 320–767 px, tablet 768–1023 px, desktop mulai 1024 px.
- Tidak ada horizontal scroll halaman pada lebar 320 px; komponen yang memang memerlukan scroll diberi batas dan petunjuk.
- Target aksesibilitas WCAG 2.2 AA. Pemeriksaan mencakup heading, landmark, kontras teks, label/error formulir, alt text, fokus terlihat, navigasi keyboard, pengelolaan fokus menu/dialog, serta zoom 200%.
- Animasi ringan menghormati preferensi reduced motion.
- Status kosong, loading, error, dan 404 memiliki pesan yang jelas serta navigasi pemulihan.

## 11. Technical Architecture & Local Development

### 11.1 Stack target

- Next.js App Router, React, TypeScript, Tailwind CSS.
- Payload CMS: autentikasi, collections/globals, access control, hooks, dan versioning/drafts sesuai desain teknis yang diverifikasi.
- PostgreSQL melalui adapter Payload, memakai Supabase sesuai pilihan pemilik proyek pada 23 Oktober 2026; lihat [register keputusan](decisions.md).
- Local filesystem untuk media awal dengan penyajian yang mematuhi §8.6; object storage atau penyimpanan server ditentukan untuk produksi.
- Node.js LTS yang kompatibel, pnpm, Git, serta koneksi PostgreSQL Supabase. Docker opsional untuk lingkungan uji terpisah.

Versi paket, integrasi editor, dan detail draft/versioning harus diverifikasi terhadap dokumentasi resmi sebelum dipasang. Fitur bawaan CMS tidak dianggap otomatis memenuhi aturan produk; desain teknis harus membuktikan pemetaan kebutuhan ke access control, penyimpanan versi, dan penyajian media.

### 11.2 Alur arsitektur

Browser → Next.js Public Website → lapisan pembacaan versi publik → Payload → PostgreSQL.  
Admin/Media Browser → Payload Admin/API → autentikasi dan otorisasi → workflow/validasi → PostgreSQL.  
Permintaan file → pemeriksaan akses aset → media storage.

Panggilan internal yang memiliki kemampuan melewati access control harus dibatasi untuk kebutuhan sistem yang terdokumentasi. Request pengguna tidak boleh memperoleh akses istimewa melalui panggilan internal tersebut.

### 11.3 Local development

- Target website: `http://localhost:3000`; CMS: `http://localhost:3000/admin`.
- Jika port terpakai, gunakan port yang dikonfigurasi dan dokumentasikan URL aktual. Jangan menghentikan proses lain secara otomatis.
- Sediakan environment example tanpa secret, koneksi Supabase hanya dari server, migration, seed, serta perintah dev/build/start/test yang terdokumentasi. Aplikasi localhost memerlukan internet untuk database hosted.
- Database Supabase dan media lokal memakai penyimpanan persisten; restart aplikasi tidak menghapus konten. Pengujian/reset memakai target terisolasi.
- Kredensial awal diperoleh dari environment atau prompt lokal yang aman. Tidak ada password default tetap atau secret di Git.
- Seed aman dijalankan ulang tanpa menggandakan data atau menimpa konten yang telah diedit tanpa opsi reset eksplisit.
- Pengisian seed dan reset tidak otomatis menargetkan database produksi.

### 11.4 Deployment readiness

Server kampus masih opsi, belum disetujui. Sebelum produksi, verifikasi runtime, PostgreSQL, kapasitas, penyimpanan media persisten, reverse proxy, HTTPS, domain/DNS, backup, restore, pengelola, dan kebijakan keamanan kampus.

Penerbitan publik memerlukan keputusan infrastruktur dan persetujuan terpisah; kelulusan demo lokal bukan persetujuan deployment.

## 12. Conceptual Data Model

Skema berikut menyatakan kebutuhan informasi, bukan DDL final. Nama field dan relasi dapat disesuaikan dengan desain Payload selama perilaku PRD terpenuhi.

### 12.1 Shared editorial data

Semua konten editorial memiliki identitas konten, owner, assignee, pembuat, waktu pembuatan/perubahan, metadata SEO jika relevan, serta relasi ke versi kerja dan versi publik. Setiap versi menyimpan isi dan referensi aset yang konsisten.

Keputusan review mengacu pada identitas versi, bukan hanya ID konten. Keberadaan field `workflowStatus` saja tidak dianggap cukup untuk melindungi publikasi.

### 12.2 Collections

| Collection | Data inti |
|---|---|
| users | name, email unik, role, status, data auth yang dikelola CMS |
| pages | pageKey tetap, title, sections/content, SEO; homepage dan about |
| articles | title, slug, excerpt, content, category, cover, publicAuthor, sources, disclaimer, publishedAt |
| research_publications | title, slug, category, summary, content, publicAuthor/team, analysisDate, cover, references, attachment, disclaimer dasar, publishedAt |
| events | title, slug, description, poster, startAt, endAt, location/channel, organizer, cancelled, registrationStatus, registrationUrl, registrationOpensAt/ClosesAt opsional |
| divisions | name, slug, description, workPrograms, displayOrder |
| organizational_periods | label unik, startDate, endDate; penunjuk periode aktif dikelola Admin terpisah dari versi editorial |
| members | name, position, division opsional, organizationalPeriod wajib, photo opsional, displayOrder |
| recruitment_periods | title, organizationalPeriod, description, positions beserta persyaratan, selectionStages, opensAt, closesAt, registrationUrl, enabledByAdmin |
| partners | name, logo, description, collaboration, websiteUrl, homepageVisibility, logoPermissionRecordedBy/At, referensi izin privat |
| achievements | title, category, date, description, recipient/team, image |
| galleries | title, slug, relatedEvent opsional, photos, captions/alt, videoLinks, description, activityDate |
| media | file identity/version, owner/assignee, MIME, size, dimensions, alt, originalName, storageKey, approval/revocation metadata |
| content_reviews | contentType, contentId, versionId, action, submittedBy, reviewedBy, notes, timestamp |
| audit_events | actor, action, target, version jika relevan, before/after status, timestamp, reason |
| categories | jenis artikel/riset, nama, slug unik dalam jenis; dikelola Admin |

Identitas versi, snapshot persetujuan, dan audit dapat memanfaatkan fasilitas CMS jika memenuhi seluruh kriteria; tidak wajib diduplikasi menjadi collection kustom.

### 12.3 Globals dan integrity rules

- Site Settings: identitas, SEO default, kontak, sosial, navigasi, dan footer.
- Maksimum satu periode organisasi aktif dan satu kampanye rekrutmen aktif; aturan ditegakkan server, termasuk saat request bersamaan.
- Periode yang dipakai members/rekrutmen tidak dapat dihapus begitu saja.
- Publikasi tidak boleh memuat relasi privat yang mengungkap draft. Relasi wajib harus memiliki target yang dapat disajikan secara publik; relasi opsional yang tidak tersedia tidak dirender.
- Identitas target relasi disimpan pada versi konten yang disetujui. Field target dibaca dari versi publik target yang terkini, bukan draftnya. Persetujuan perubahan target dapat memperbarui tampilan relasi tanpa review ulang konten induk; perubahan pilihan ID target pada induk tetap memerlukan review. Relasi tidak mengizinkan pembacaan snapshot privat atau metadata internal.
- Indeks dan batasan unik ditentukan dalam desain teknis berdasarkan slug, kategori, waktu publikasi, periode, serta query akses yang diperlukan.
- Email, assignment, catatan review, dan bukti izin tidak termasuk proyeksi data publik.

## 13. Non-Functional Requirements

### Performance

- Target Lighthouse Performance minimal **85** untuk `/`, `/publikasi/artikel`, satu detail artikel, dan `/kegiatan`.
- Usulan kondisi uji: build production lokal; profil mobile bawaan Lighthouse; browser dan versi Lighthouse dicatat; dataset demo tetap; tiga pengukuran per halaman setelah warm-up; median skor per halaman minimal 85.
- Pengukuran tidak memakai dev server. Mesin, throttling, waktu uji, dan hasil disimpan agar angka dapat ditafsirkan. Perubahan kondisi uji dicatat sebelum membandingkan skor.
- Gambar dioptimalkan, dimensi disediakan, dan pagination membatasi payload. Cache tidak boleh menyebabkan kebocoran draft atau penerbitan di luar aturan waktu.

### SEO

- Judul/deskripsi unik, canonical dari base URL terkonfigurasi, Open Graph, sitemap XML, robots.txt, dan structured data yang sesuai isi.
- Sitemap hanya mencantumkan URL yang diterbitkan. CMS dan preview privat tidak diindeks; larangan indeks bukan pengganti otorisasi.
- Demo tidak menyatakan domain localhost sebagai domain resmi produksi. Indeks publik demo harus dinonaktifkan bila demo dibuka melalui tunnel atau staging.

### Security

- Autentikasi dan hashing melalui mekanisme CMS; otorisasi server pada setiap jalur baca/tulis.
- Penolakan manipulasi role, owner, approval, audit, status, dan file melalui request langsung.
- Rich text/URL/upload divalidasi server; tidak merender script atau konten aktif dari input editor.
- Proteksi login terhadap percobaan berulang, cookie sesi yang sesuai lingkungan, proteksi request lintas situs, dan konfigurasi origin terdokumentasi serta diuji.
- Secret melalui environment; tidak dikirim ke klien atau disimpan dalam log.
- HTTPS wajib pada produksi. Dependency dan konfigurasi keamanan diperiksa sebelum deployment.

### Reliability & observability

- Kesalahan CMS/API menampilkan pesan aman tanpa stack trace, kredensial, atau detail koneksi database kepada publik.
- Kegagalan publikasi dicatat dan tidak meninggalkan versi publik parsial.
- Log server memuat tindakan gagal yang relevan dan identitas korelasi tanpa isi sensitif. Audit editorial tetap tersedia setelah restart.
- Backup mencakup database dan media yang saling konsisten. Panduan backup/restore disediakan pada demo.
- Sebelum produksi, restore diuji di lingkungan terpisah, dengan bukti konten dan file dapat diakses sesuai izin. Frekuensi backup, retensi, dan target pemulihan ditetapkan bersama pengelola hosting.

### Maintainability

- TypeScript, struktur modular, migration database, lockfile, komponen reusable, dan dokumentasi setup/pengujian.
- Perubahan aturan publikasi harus disertai uji regresi izin dan versi.
- Klaim aksesibilitas penuh, keamanan produksi, atau performa hosting hanya dibuat berdasarkan hasil pengujian yang sesuai; demo lokal tidak otomatis membuktikannya.

## 14. User Stories & Acceptance Scenarios

### 14.1 User stories

- **US-01:** Mahasiswa membaca profil dan program GIBEI.
- **US-02:** Calon anggota membandingkan posisi, persyaratan, dan tahapan rekrutmen.
- **US-03:** Pembaca membuka Equity Snapshot dengan tanggal analisis, sumber, dan disclaimer.
- **US-04:** Pengunjung menemukan kegiatan mendatang dan tautan daftar yang aktif.
- **US-05:** Media Communication menyiapkan draft dan mengajukannya.
- **US-06:** Admin meninjau versi tertentu, meminta revisi, atau menerbitkannya.
- **US-07:** Media Communication mengelola dokumentasi tanpa membocorkan file draft.
- **US-08:** Pengunjung menggunakan website dari smartphone dan keyboard.
- **US-09:** Pengurus baru mengganti periode aktif tanpa menghilangkan riwayat.
- **US-10:** Editor memperbaiki artikel terbit sementara pembaca tetap mendapat versi yang disetujui.

### 14.2 Skenario minimum yang harus lulus

| ID | Skenario | Hasil yang wajib |
|---|---|---|
| AC-01 | Media membuat draft lalu mengajukan review | Owner server benar, versi terkunci, pengajuan tercatat |
| AC-02 | Media mencoba publish, mengganti role/owner, atau memalsukan review melalui API | Ditolak; data dan versi publik tidak berubah |
| AC-03 | Media membuka draft pengguna lain tanpa penugasan | Tidak mendapat isi/metadata privat |
| AC-04 | Admin meminta revisi tanpa catatan | Ditolak; dengan catatan valid menjadi revision_required |
| AC-05 | Pengunjung meminta draft melalui detail, API, pencarian, relasi, metadata, atau sitemap | Tidak ada isi, judul, excerpt, maupun jumlah hasil yang membocorkan draft |
| AC-06 | Pengunjung meminta URL asli, thumbnail, transformasi gambar, dan PDF draft | Ditolak tanpa mengirim isi file |
| AC-07 | Admin menyetujui versi yang diajukan | Isi dan aset yang disetujui tersedia publik, pelaksana/waktu/versi tercatat |
| AC-08 | Editor merevisi artikel terbit | Versi publik lama termasuk metadata/aset tetap tampil hingga persetujuan baru |
| AC-09 | Ada edit atau keputusan bersamaan terhadap review usang | Konflik ditolak; tidak ada versi yang salah diterbitkan |
| AC-10 | Admin menarik publikasi dengan revisi menunggu | Detail menjadi 404, daftar/cache bersih, pengajuan batal; penerbitan ulang perlu pengajuan baru |
| AC-11 | Media dipakai dua konten publik lalu salah satu ditarik | File tetap publik untuk referensi yang masih sah; setelah referensi terakhir dicabut, seluruh URL turunannya ditolak |
| AC-12 | Admin menghapus media yang masih dirujuk | Ditolak dan referensi ditampilkan; pencabutan darurat menutup file serta memberi fallback |
| AC-13 | File oversized, MIME palsu, SVG/HTML atau file aktif diunggah | Ditolak server; tidak menjadi file publik yatim |
| AC-14 | Rekrutmen sebelum buka, tepat buka, tepat tutup, dinonaktifkan, URL kosong/tidak valid | CTA mengikuti seluruh syarat; pada waktu tutup CTA hilang meskipun halaman pernah di-cache |
| AC-15 | Event upcoming/ongoing/completed/cancelled dan pendaftaran ditutup | Status dan CTA benar termasuk pada batas waktu server |
| AC-16 | Periode organisasi diganti | Hanya satu current, pengurus lama tetap pada periodenya dan riwayat terbit masih terbaca |
| AC-17 | Akun dinonaktifkan atau Admin aktif terakhir hendak diturunkan | Sesi akun nonaktif ditolak; operasi pada Admin terakhir ditolak |
| AC-18 | Artikel/riset dicari dan difilter dengan pagination termasuk hasil kosong | Hasil sesuai parameter dan hanya versi publik; tidak ada error mentah |
| AC-19 | Halaman diuji pada 320, 375, 768, 1024, dan 1440 px serta keyboard/zoom | Navigasi dan konten dapat digunakan; pemeriksaan §10 dicatat |
| AC-20 | Detail riset tanpa disclaimer atau tanggal analisis hendak diterbitkan | Publikasi ditolak atau disclaimer dasar dipasang wajib; halaman terbit selalu menampilkan keduanya |
| AC-21 | Site Settings diubah Admin | Kontak/navigasi/footer konsisten, aset sah, dan audit perubahan tersedia |
| AC-22 | Setup bersih, restart, dan seed dijalankan ulang | Demo dapat dijalankan; data persisten; tidak ada duplikasi atau penimpaan diam-diam |
| AC-23 | Input rich text/URL berbahaya dan request lintas situs tidak sah | Ditolak atau disanitasi; tidak menjalankan script maupun mengubah data tanpa izin |
| AC-24 | Daftar/detail album, prestasi per tahun, dan mitra dibuka | Data terbit tampil, logo tanpa izin tidak muncul, aset dan alt sesuai review |
| AC-25 | Error database/storage dan kegagalan saat publish disimulasikan | Pesan aman, kegagalan tercatat, tidak ada publikasi parsial tanpa audit |
| AC-26 | Target relasi memiliki revisi draft, lalu revisi disetujui atau target hendak ditarik | Induk membaca versi publik target; penarikan target wajib ditolak dengan dependensi; relasi opsional disembunyikan setelah penarikan |
| AC-27 | Media mengirim ID aset privat milik pengguna lain tanpa penugasan pada simpan/submit | Ditolak server tanpa mengungkap metadata aset; aset publik yang sah dapat digunakan ulang |
| AC-28 | Admin mengaktifkan periode draft, dua Admin memilih periode bersamaan, atau periode aktif ditarik | Target draft ditolak; maksimum satu aktif; penarikan yang sah mengosongkan pilihan tanpa menghapus riwayat |
| AC-29 | Dua kampanye terbit dengan tanggal tumpang tindih diaktifkan bersamaan, termasuk kampanye mendatang | Maksimum satu enabled; request konflik ditolak; waktu tutup menyembunyikan CTA; penarikan menonaktifkan kampanye |

Uji otorisasi dijalankan melalui request langsung di samping UI. Uji workflow tidak dianggap lulus hanya karena tombol disembunyikan. Skenario kritis izin, draft, revisi, dan media harus diotomasi pada tingkat integrasi yang relevan.

## 15. MVP Implementation Plan

Urutan pengerjaan mendahulukan bukti alur publikasi sebelum memperluas seluruh modul.

### Phase 1 — Foundation dan desain teknis

- Validasi baseline akses/revisi/media pada §18.
- Verifikasi kompatibilitas versi stack dan desain model versi, akses file, serta audit.
- Setup proyek, PostgreSQL, environment, auth/role, migration, dan design system awal.
- Dokumentasikan pemetaan PRD ke implementasi dan strategi pengujian.

### Phase 2 — Satu alur publikasi lengkap

- Implementasikan artikel, media privat, ownership/assignment, review, audit, dan halaman daftar/detail publik.
- Buktikan revisi terbit, penolakan publish tanpa izin, serta perlindungan URL file.
- Selesaikan kegagalan arsitektur pada alur ini sebelum menggandakan pola ke modul lain.

### Phase 3 — Modul P0 lainnya

- Homepage, About, divisi/pengurus/periode, riset, event, rekrutmen, dan kontak.
- Lengkapi Site Settings dan aturan waktu/CTA.
- Pengujian berjalan bersama setiap modul.

### Phase 4 — Modul P1 dan QA menyeluruh

- Galeri, partnership, prestasi.
- Uji seluruh acceptance scenario, responsivitas, aksesibilitas, SEO, error handling, dan performa.
- Tinjau keamanan media serta publikasi lintas seluruh jenis konten.

### Phase 5 — Demo localhost dan serah terima

- Seed bertanda contoh, dua akun peran demo, dokumentasi setup dan panduan penggunaan CMS.
- Demo alur normal dan penolakan akses yang tidak sah.
- Catat hasil pengujian, keterbatasan, serta checklist produksi yang belum selesai.

Target tanggal dan estimasi kerja ditentukan setelah kapasitas pengembang, aset, serta baseline disepakati. PRD ini tidak menetapkan estimasi tanpa dasar.

## 16. Definition of Done

MVP localhost selesai jika:

1. Sebelas modul publik P0/P1 pada §5 tersedia dan seluruh rute wajib dapat digunakan.
2. Delapan divisi, periode, dan pengurus dapat dikelola tanpa menghapus riwayat.
3. Admin dan Media Communication menjalankan workflow sesuai matriks izin, termasuk request API langsung.
4. Revisi versi terbit tidak mengubah publik sebelum persetujuan, dan review terikat versi yang benar.
5. Draft, relasi privat, audit, serta media belum disetujui tidak dapat diakses publik.
6. Penarikan publikasi, pencabutan aset, cache, dan waktu CTA sesuai aturan.
7. Semua AC-01 sampai AC-29 lulus dengan bukti. Kegagalan harus diperbaiki atau cakupan PRD diubah secara eksplisit sebelum dinyatakan selesai.
8. Pemeriksaan UI/responsif/aksesibilitas pada §10 dan target performa pada §13 memiliki hasil tercatat.
9. Metadata, sitemap, robots, canonical, dan structured data relevan telah diperiksa.
10. Setup bersih dan seed dapat diulang; database serta media bertahan setelah restart.
11. Ada panduan instalasi, migration, akun awal, CMS, backup/restore, dan catatan persiapan deployment.
12. Contoh konten diberi label, tidak mengklaim kontak/mitra/prestasi yang belum diverifikasi, dan tidak memuat data sensitif.

Kesiapan produksi memiliki syarat tambahan: infrastruktur dan domain disetujui, HTTPS, secret produksi, backup/retensi, restore teruji, kebijakan pemulihan akun, serta tinjauan konten resmi. Syarat produksi tidak dianggap sudah terpenuhi oleh demo localhost.

## 17. Risks & Mitigations

| Risiko | Mitigasi |
|---|---|
| Brand guideline belum tersedia | Identitas sementara terdokumentasi; finalisasi setelah aset resmi diterima |
| Hosting belum disetujui | Local-first; konfigurasi portabel; tanpa ketergantungan server kampus yang belum diverifikasi |
| Konten tidak lengkap atau fiktif dianggap resmi | Label contoh pada halaman/kartu/detail dan metadata berbagi; CTA tidak aktif untuk tujuan yang belum terkonfirmasi |
| Konten investasi disalahartikan | Tanggal analisis, sumber, disclaimer wajib, dan review editorial |
| Draft atau PDF bocor lewat URL | Akses file mengikuti izin; uji file asli dan semua turunan |
| Editor mengubah materi sesudah disetujui | Persetujuan berbasis versi; aset immutable; revisi wajib review |
| Pergantian kepengurusan | Riwayat periode, akun bernama, transfer assignment, dokumentasi serah terima |
| Media dihapus saat masih dipakai | Pemeriksaan referensi, penolakan hapus, pencabutan darurat terpisah |
| Data pribadi/dokumen internal terunggah | Pembatasan jenis materi, review, akses privat awal, dan prosedur pencabutan |
| Asumsi fitur CMS tidak sesuai kebutuhan | Pembuktian satu alur lengkap sebelum memperluas modul |

## 18. Decision Register & Open Questions

### 18.1 Baseline disetujui pemilik proyek — 23 Oktober 2026

| ID | Keputusan | Pihak penentu | Status |
|---|---|---|---|
| D-01 | P0 dan P1 sama-sama wajib untuk MVP lengkap | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-02 | Versi publik tetap tampil selama revisi; maksimum satu revisi kerja aktif | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-03 | Persetujuan sekaligus publish; Admin boleh menyetujui materi sendiri; tanpa jadwal publish | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-04 | Izin owner/assignee; akun hanya dibuat Admin; Media tidak menghapus permanen | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-05 | Upload privat, persetujuan aset berbasis versi, pencabutan setelah referensi publik terakhir hilang | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-06 | Batas upload 5 MiB gambar/15 MiB PDF; JPEG/PNG/WebP/PDF saja | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-07 | Maksimum satu periode terbit dipilih aktif dan satu kampanye terbit enabled, terpisah dari versi editorial; waktu WIB | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-08 | Slug dikunci setelah publikasi pertama | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-09 | Kondisi Lighthouse dan skenario kelulusan pada §13–16 | Pemilik proyek | Disetujui — 23 Oktober 2026 |
| D-10 | Konfigurasi global hanya Admin; isi halaman mengikuti workflow editorial | Pemilik proyek | Disetujui — 23 Oktober 2026 |

Persetujuan paket baseline diberikan langsung oleh pemilik proyek melalui pesan: “T001 saya sudah setuju, silahkan anda lanjutkan dan tandai kita bisa next ke T002”. Bukti, dampak tugas, dan informasi yang masih terbuka dicatat pada [register keputusan](decisions.md). Perubahan berikutnya memerlukan pencatatan keputusan baru; T002–T003 tetap harus membuktikan kompatibilitas stack dan rancangan teknis.

### 18.2 Informasi organisasi dan produksi yang masih terbuka

1. Logo, HEX, font, brand guideline, dan izin penggunaan foto.
2. Periode aktif, struktur lengkap, nama/jabatan, serta foto pengurus yang diizinkan publik.
3. Konten awal dan sumber yang telah diverifikasi, termasuk rumusan disclaimer final.
4. Identitas Admin yang berwenang dan penanggung jawab serah terima akun.
5. Email, lokasi, media sosial, dan tautan pendaftaran terkonfirmasi.
6. Izin penggunaan nama/logo mitra dan bukti yang disimpan secara privat.
7. Domain, spesifikasi/izin server UISI, dan penyimpanan produksi.
8. Kebijakan backup, retensi, target pemulihan, dan email pemulihan akun produksi.
9. Target waktu, jumlah pengembang, dan jadwal validasi stakeholder.

Ketiadaan aset resmi tidak menghalangi prototipe dengan placeholder yang jelas. Keputusan yang memengaruhi izin, versi, dan penyimpanan media diselesaikan sebelum implementasi bagian tersebut.

## 19. Future Enhancements

Statistik pengunjung, newsletter, pencarian lanjutan, multibahasa, pengajuan konten antar divisi, dokumen internal, kalender, data pasar berlisensi, alumni, keanggotaan, penjadwalan publikasi, dan redirect slug.

Setiap tambahan membutuhkan evaluasi manfaat, biaya, keamanan, serta kapasitas pemeliharaan. Daftar ini bukan komitmen MVP.

## 20. Final Product Vision

GIBEI UISI Official Website menjadi pusat informasi dan publikasi yang profesional, kredibel, mudah dikelola, serta dapat diteruskan ke kepengurusan berikutnya.

Prioritasnya adalah website publik berkualitas dengan CMS dan alur persetujuan yang dapat dibuktikan melalui pengujian. Baseline PRD v1.1 telah disetujui pemilik proyek pada 23 Oktober 2026. T001–T005 selesai; kerangka Next.js dan fondasi PostgreSQL Supabase telah diverifikasi, dengan bukti pada [T004](reports/T004.md) dan [T005](reports/T005.md). Langkah berikutnya T006 untuk integrasi Payload dan login; CMS dan workflow editorial belum diimplementasikan.
