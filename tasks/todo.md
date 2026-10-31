# Checklist Implementasi GIBEI UISI

Tanggal: 21 Oktober 2026. Acuan: [PRD v1.1](../docs/PRD-v1.1.md). Peta pengerjaan: [plan.md](plan.md).

**Status terbaru — T020:** T001–T020 selesai; CP-01–CP-06 ditinjau. Batch T011–T020 lulus 20 unit, 30 integration dan 18 e2e, lint/TypeScript/build, migrasi Supabase dan probe CMS lokal. [Laporan akhir batch](../docs/reports/T020.md). Berikutnya **T021**, konflik review dan audit. UI antrean, halaman artikel dan alur lengkap tetap T022–T025; MVP belum selesai.

## Cara menggunakan checklist

- Kerjakan satu tugas yang dependensinya sudah selesai. Tandai selesai hanya setelah acceptance criteria dan verifikasinya terbukti; tuliskan tautan hasil pada kolom bukti.
- Status: belum mulai → dikerjakan → selesai; gunakan keterangan blocked beserta alasan jika masukan wajib belum ada. Dependensi yang gagal hanya menahan tugas yang bergantung padanya.
- S = sekitar 1–2 file; M = sekitar 3–5 file. Ini perkiraan lingkup, bukan estimasi jam. Path pada setiap tugas adalah **usulan**, karena aplikasi belum dibuat. Pecah menjadi ID turunan seperti T015.1 bila lingkup aktual melebihi 5 file yang dikerjakan atau memerlukan lebih dari satu sesi fokus; jangan memperluas tugas diam-diam.
- Tes pada tugas fitur adalah bukti fungsi/izin, bukan sekadar mencerminkan struktur kode. Hindari membuat tes yang tidak menambah keyakinan untuk perubahan dokumen atau gaya yang sederhana.
- Setelah T004, perubahan runtime menjalankan lint, typecheck, dan build yang relevan; setelah T008 gunakan suite terarah unit/integration/e2e sesuai verifikasi tugas. Perintah persis ditetapkan saat tooling tersedia. Dokumen tidak perlu build aplikasi. Tidak ada hasil tes aplikasi yang diklaim pada tahap perencanaan ini.
- Setiap tugas yang menambah collection editorial wajib memakai kontrak ownership/review/versioning/media yang lulus T025; tidak cukup menyembunyikan tombol publish. Tambahkan migration yang dibutuhkan dalam lingkup tugas itu, lalu verifikasi pada database uji.
- Checkpoint menyimpan bukti, memeriksa regresi, dan memperbarui status. Checkpoint bukan persetujuan deployment atau pernyataan bahwa baseline yang masih usulan sudah disetujui.

## Fase A — Fondasi proyek

Keputusan, rancangan, runtime lokal, CMS login, dan fondasi UI tersedia.

### T001

- [x] **Catat keputusan baseline PRD**

**Hasil:** Siapkan register keputusan untuk sepuluh usulan tanpa menganggap permintaan membuat backlog sebagai persetujuan.

**Dependensi:** Tidak ada  
**Acuan PRD:** §18; D-01–D-10  
**Ukuran:** S  
**File yang mungkin disentuh:** docs/decisions.md

**Kriteria selesai:**

- [x] Setiap D-01–D-10 memiliki keputusan yang divalidasi pemilik proyek, pihak penentu, bukti/tanggal, dan dampak ke tugas berikutnya. Register boleh disiapkan lebih awal, tetapi T001 belum selesai selama keputusan wajib masih usulan.
- [x] Keputusan yang belum ada tetap ditandai usulan; aset dan hosting yang belum tersedia tercatat.

**Verifikasi:** Bandingkan register dengan §18; jangan menandai keputusan disetujui tanpa bukti dari pemilik proyek. T002–T003 dapat diteliti sambil menunggu; tugas implementasi T004 dan turunannya menunggu kelulusan T001.

**Bukti/status:** Selesai pada 23 Oktober 2026 berdasarkan persetujuan langsung pemilik proyek: “T001 saya sudah setuju, silahkan anda lanjutkan dan tandai kita bisa next ke T002”. [Register keputusan](../docs/decisions.md) memuat D-01–D-10, pihak penentu, tanggal, dampak tugas, dan informasi yang masih terbuka; status PRD §18 telah diselaraskan.

### T002

- [x] **Verifikasi kompatibilitas stack**

**Hasil:** Pilih versi Node.js, pnpm, Next.js, React, Payload, adapter PostgreSQL, dan Tailwind berdasarkan dokumentasi resmi pada saat implementasi.

**Dependensi:** Tidak ada  
**Acuan PRD:** §11.1  
**Ukuran:** S  
**File yang mungkin disentuh:** docs/technical/stack.md

**Kriteria selesai:**

- [x] Matriks versi mencantumkan sumber resmi dan tanggal pengecekan.
- [x] Batasan integrasi, runtime lokal, dan kebutuhan PostgreSQL dicatat tanpa memasang paket pada tugas dokumentasi ini.

**Verifikasi:** Periksa rentang kompatibilitas antar paket dan ketersediaan runtime lokal; tandai yang belum terverifikasi.

**Bukti/status:** Selesai pada 23 Oktober 2026. [Matriks stack](../docs/technical/stack.md) mencatat versi, sumber resmi/metadata registry, pemeriksaan engine dan peer dependency, kondisi mesin, serta prasyarat Node LTS dan Docker/PostgreSQL. Tidak ada paket yang dipasang; build dan integrasi database belum diuji. Persetujuan melanjutkan berasal dari pesan pemilik proyek: “T002 saya sudah setuju, silahkan anda lanjutkan dan tandai kita bisa next ke T003”. T003 siap dikerjakan.

### T003

- [x] **Rancang kontrak versi dan akses file**

**Hasil:** Dokumentasikan cara memenuhi satu versi publik, satu revisi kerja, approval berbasis versi, audit atomik, serta media privat.

**Dependensi:** T002  
**Acuan PRD:** §8.3–8.6; §11.2; §12  
**Ukuran:** M  
**File yang mungkin disentuh:** docs/technical/editorial-architecture.md; docs/technical/media-access.md

**Kriteria selesai:**

- [x] Alur create→review→publish→revise→withdraw dipetakan ke fitur CMS dan kebutuhan kustom.
- [x] Desain menjelaskan proteksi API/internal calls, file asli/turunan, transaksi, cache, referensi, dan konflik.
- [x] Risiko fitur CMS yang belum terbukti memiliki percobaan terarah pada T011–T025.

**Verifikasi:** Telusuri contoh artikel dengan PDF dan dua revisi sampai penarikan; catat keputusan sebagai usulan sampai baseline terkait disetujui.

**Bukti/status:** Selesai pada 23 Oktober 2026. [Kontrak editorial](../docs/technical/editorial-architecture.md) dan [akses media](../docs/technical/media-access.md) memetakan fitur CMS/kustom, transaksi, konflik, Supabase, cache, serta eksperimen T011–T025. Penelusuran dokumen mencakup artikel R1/P1, revisi R2/P2, pending R3, penarikan, reuse dan revoke; hasil yang diharapkan konsisten dengan baseline. Belum ada pengujian runtime atau perubahan remote. T004 siap dikerjakan.

#### CP-01 — setelah T003

- [x] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [x] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan. **Tidak berlaku pada CP-01:** hanya dokumen; tidak ada aplikasi/build yang dijalankan.
- [x] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

**Bukti CP-01 — 23 Oktober 2026:** T001 memiliki bukti persetujuan; T002 memiliki matriks sumber/runtime; T003 memiliki kedua kontrak dan penelusuran skenario. Node target belum disiapkan dan koneksi/versi Supabase belum diuji; ditangani pada T004/T005. Rancangan schemaName experimental, locking/transaksi dan file gateway memiliki eksperimen eksplisit. T004 dan tugas implementasi lain tetap belum dicentang.

### T004

- [x] **Buat kerangka Next.js dan tooling**

**Hasil:** Inisialisasi aplikasi sesuai versi yang dipilih dan struktur kode minimum. Jika belum ada Git, inisialisasi lokal tanpa remote/push.

**Dependensi:** T001, T002, T003  
**Acuan PRD:** §11.1; §13 Maintainability  
**Ukuran:** M  
**File yang mungkin disentuh:** package.json; pnpm-lock.yaml; src/app/*; konfigurasi dasar; .gitignore

**Kriteria selesai:**

- [x] Aplikasi dasar berjalan; scripts lint, typecheck, build, dev, dan start tersedia dengan lockfile.
- [x] Ignore rules mengecualikan secret, media lokal, build, dan dependency; environment example berisi placeholder.

**Verifikasi:** Jalankan lint/typecheck/build dan buka halaman dasar; jangan mengklaim CMS atau database sudah berfungsi.

**Bukti/status:** Selesai 26 Oktober 2026. T004.1 (runtime/Git/kerangka/tooling) dan T004.2 (lockfile/lint/typecheck/build/dev/start/browser) selesai; pemecahan menjaga lingkup fondasi yang memerlukan lebih dari lima berkas. [Laporan T004](../docs/reports/T004.md) mencatat hasil aktual, penyesuaian TypeScript, keterbatasan tooling dan browser 320/1440 px. Koneksi Supabase/Payload mengikuti T005/T006.

### T005

- [x] **Hubungkan PostgreSQL Supabase dan migration awal**

**Hasil:** Hubungkan aplikasi lokal ke PostgreSQL Supabase proyek `lgqnxvldjqzgbfyxqonx` melalui environment server dengan schema/role yang melindungi data CMS.

**Dependensi:** T004  
**Acuan PRD:** §11.3; AC-22  
**Ukuran:** M  
**File yang mungkin disentuh:** .env.example; src/payload.config.ts; src/migrations/*; docs/setup.md

**Kriteria selesai:**

- [x] Koneksi Supabase berhasil; versi PostgreSQL aktual, TLS, mode koneksi, role/schema dan proteksi Data API dicatat tanpa membocorkan kredensial.
- [x] Migration awal dapat diterapkan pada target pengembangan kosong yang terisolasi; transaksi terbukti dan data uji bertahan setelah restart aplikasi/reconnect.

**Verifikasi:** Uji query koneksi/versi, migration, commit/rollback, restart aplikasi/reconnect, lalu baca kembali data uji. Pastikan target terisolasi sebelum penulisan; jangan reset proyek bersama atau tabel layanan Supabase. Docker lokal bukan prasyarat.

**Bukti/status:** Selesai 26 Oktober 2026, dengan pecahan T005.1 (akses/koneksi/TLS), T005.2 (fondasi/migration/role), T005.3 (transaksi/persistensi/regresi) karena lingkup melampaui lima berkas. [Laporan T005](../docs/reports/T005.md) mencatat PostgreSQL 17.11, Session pooler, TLS client authorized, role terpisah, migration 20261026101710, proteksi Data API, commit/rollback dan pembacaan dari proses baru. Fixture dibersihkan; tabel layanan Supabase tidak diubah. Batas TLS internal pooler dan dua warning advisor bawaan dicatat; adapter Payload belum diuji.

### T006

- [x] **Aktifkan Payload dan login CMS**

**Hasil:** Pasang Payload dalam aplikasi dan buat users dengan role admin/media serta bootstrap Admin yang terlindungi.

**Dependensi:** T004, T005  
**Acuan PRD:** §8.1–8.2; §11.2  
**Ukuran:** M  
**File yang mungkin disentuh:** src/payload.config.ts; src/collections/Users.ts; src/app/(payload)/*; scripts/bootstrap-admin.*

**Kriteria selesai:**

- [x] Admin awal dibuat lewat prosedur lokal aman tanpa password tetap atau pendaftaran publik bebas.
- [x] Login/logout bekerja; pengunjung tanpa login tidak mendapat akses CMS privat.

**Verifikasi:** Login/logout dari browser dan request langsung; uji first-user/bootstrap setelah akun Admin sudah ada.

**Bukti/status:** Selesai 30 Oktober 2026. T006.1 (integrasi/migration), T006.2 (bootstrap/auth) dan T006.3 (verifikasi) dipisahkan karena lingkup melampaui lima berkas. [Laporan T006](../docs/reports/T006.md) mencatat schema privat, migration Payload, satu Admin demo, bootstrap ulang skip, request anonim ditolak, login/logout API/browser, cookie/sesi, Data API 406 serta lint/typecheck/build. Audit: DOMPurify dipatch; GraphQL high yang tersisa dibatasi oleh GraphQL nonaktif, temuan lain dicatat untuk T053. Bukan kesiapan produksi.

#### CP-02 — setelah T006

- [x] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [x] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [x] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

**Bukti CP-02 — 30 Oktober 2026:** laporan T004/T005/T006 tersedia. Regresi database, kebijakan akun dan konfigurasi lulus; API/browser dev serta hasil produksi lulus; halaman publik tetap berjalan. T007 (kontrol akun lengkap), T008 (harness/fixture) dan T053 (audit menyeluruh) tetap belum selesai. Batas TLS internal serta warning advisor T005 dipertahankan; perubahan whitespace pengguna pada migration T005 tidak ikut pekerjaan ini.

### T007

- [x] **Batasi pengelolaan akun dan sesi**

**Hasil:** Terapkan kontrol role/status akun, perlindungan Admin terakhir, serta reset password lokal oleh Admin.

**Dependensi:** T006  
**Acuan PRD:** §8.2; AC-17  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Users.ts; src/access/users.*; src/audit/*; tests/integration/users.*

**Kriteria selesai:**

- [x] Hanya Admin dapat membuat akun, mengubah role/status, atau melakukan reset lokal.
- [x] Akun nonaktif ditolak pada request berikutnya termasuk sesi lama; Admin aktif terakhir tidak dapat dihapus/diturunkan/nonaktif.
- [x] Perubahan akun diaudit tanpa password/token.

**Verifikasi:** Uji API sebagai pengunjung, Media, dan Admin; uji dua perubahan Admin bersamaan dan sesi yang sudah login.

**Bukti/status:** Selesai 30 Oktober 2026 melalui T007.1 (kebijakan/transaksi), T007.2 (audit/migration) dan T007.3 (verifikasi/dokumentasi). [Laporan T007](../docs/reports/T007.md) mencatat API dan Local API, sesi nonaktif/lama, reset lokal, race Admin 200/409, rollback saat audit gagal, izin append-only database, serta browser dan pemeriksaan statis/build. Akun pengembangan tetap satu Admin aktif; schema uji dibersihkan. Penghapusan permanen tetap ditolak sesuai PRD. T008 siap dikerjakan.

### T008

- [x] **Siapkan harness uji izin dan browser**

**Hasil:** Buat fixture Admin, dua Media, database uji terpisah, dan browser runner untuk membuktikan aturan berikutnya.

**Dependensi:** T005, T006  
**Acuan PRD:** §14.2; §16  
**Ukuran:** M  
**File yang mungkin disentuh:** package.json; test runner configs; tests/fixtures/*; tests/smoke/*

**Kriteria selesai:**

- [x] Scripts test:unit, test:integration, dan test:e2e tersedia dengan isolasi data uji.
- [x] Ada smoke test login serta fixture request terautentikasi dan anonim; reset data tidak menyentuh database non-uji.

**Verifikasi:** Jalankan satu tes bermakna di tiap lapisan dan pastikan target database terisolasi sebelum cleanup.

**Bukti/status:** Selesai 30 Oktober 2026 melalui T008.1 (runner/unit/guard), T008.2 (database/fixture API), T008.3 (browser/verifikasi/dokumentasi). [Laporan T008](../docs/reports/T008.md) mencatat 10 unit, 3 integration dan 3 e2e lulus pada database PostgreSQL 17.11 lokal baru dengan fixture Admin/dua Media. Guard reset dan cleanup lulus; akun pengembangan Supabase tidak berubah. Docker engine belum aktif; backend native portable yang diverifikasi dipakai. [Panduan pengujian](../docs/testing.md) memuat cara menjalankan. T009 siap dikerjakan.

### T009

- [x] **Buat fondasi visual dan layout publik**

**Hasil:** Tetapkan token warna/font sementara, layout, navigasi dasar, footer, dan komponen status minimum.

**Dependensi:** T004  
**Acuan PRD:** §10; FR-01  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/layout.tsx; src/styles/*; src/components/navigation/*; docs/design.md

**Kriteria selesai:**

- [x] Layout bekerja pada 320 px dan desktop, dengan fokus terlihat serta menu keyboard.
- [x] Identitas sementara dan aset contoh dilabeli; kontak/mitra fiktif tidak ditampilkan sebagai resmi.

**Verifikasi:** Periksa di browser pada 320/375/1024 px, keyboard, dan reduced motion; build aplikasi.

**Bukti/status:** Selesai melalui T009.1 (token/font/tooling), T009.2 (layout/navigasi/status), T009.3 (verifikasi/dokumentasi). [Laporan T009](../docs/reports/T009.md) dan [panduan desain](../docs/design.md) memuat palet/font sementara, ilustrasi konseptual, status kosong serta batas CMS. Verifikasi 320/375/768/1024/1440px, keyboard, reduced motion, ukuran teks 200%, 13 e2e dan audit axe terarah lulus. PostCSS dipatch; kontak/mitra tidak dikarang. T010 siap dikerjakan.

#### CP-03 — setelah T009

- [x] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [x] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [x] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

**Bukti CP-03:** laporan T007/T008/T009 tersedia. Kontrol akun, harness terisolasi dan fondasi publik telah diverifikasi. Regresi 10 unit, 3 integration dan 13 e2e serta lint/typecheck/build lulus; audit axe desktop/mobile tidak menemukan pelanggaran otomatis dalam aturan yang diuji. Aset resmi, konten organisasi dan kesiapan produksi tetap terbuka. Database test memakai backend native karena Docker engine belum aktif. T010–T063 belum dianggap selesai dan workflow editorial tetap menunggu implementasi.

## Fase B — Satu alur artikel lengkap

Draft sampai revisi/penarikan terbukti pada API, CMS, file, dan website publik.

### T010

- [x] **Buat draft artikel dengan ownership**

**Hasil:** Tambahkan collection artikel dan kategori artikel, owner/assignee, penulis publik terpisah, serta slug unik.

**Dependensi:** T007, T008  
**Acuan PRD:** FR-04; §8.1–8.2; AC-03  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Articles.ts; src/collections/Categories.ts; src/access/editorial.*; tests/integration/articles.*

**Kriteria selesai:**

- [x] Media hanya membaca/mengedit draft milik sendiri atau ditugaskan; createdBy ditetapkan server.
- [x] Hanya Admin mengubah owner/assignee/kategori; spoofing field melalui API ditolak.
- [x] Judul, excerpt, rich text, kategori, sumber dan penulis publik dapat disimpan tanpa menerbitkan.

**Verifikasi:** Tes integrasi dua Media termasuk ID draft yang ditebak, assignment, dan duplikasi slug.

**Bukti/status:** Selesai pada 31 Oktober 2026. [Laporan T010](../docs/reports/T010.md): 13 unit, 7 integration, pemeriksaan Local API dan 15 e2e lulus; create/edit/reload CMS, dua Media, assignment/transfer, spoofing, slug unik, rollback audit serta konflik simpan dibuktikan. Lint/build/typecheck dan frozen install lulus; migrasi Supabase serta regresi localhost terverifikasi. T011 siap.

### T011

- [x] **Terima upload privat yang tervalidasi**

**Hasil:** Implementasikan media privat dengan pemeriksaan ukuran, format, signature, dimensi, nama penyimpanan, dan alt.

**Dependensi:** T008, T010  
**Acuan PRD:** §8.6; AC-13  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Media.ts; src/media/validate.*; src/media/storage.*; tests/integration/uploads.*

**Kriteria selesai:**

- [x] JPEG/PNG/WebP/PDF valid diterima sesuai batas yang disetujui; SVG/HTML/executable/MIME palsu ditolak.
- [x] File gagal tidak menjadi aset publik atau path arbitrer; file tidak disimpan dalam direktori publik bebas.
- [x] Metadata privat hanya terbaca pemilik/assignee atau Admin.

**Verifikasi:** Uji file valid, oversized, gambar berdimensi besar, signature palsu, dan nama file berbahaya melalui API.

**Bukti/status:** Implementasi/uji selesai. [Laporan T011](../docs/reports/T011.md): 16 unit, 9 integration dan 16 e2e lulus, termasuk upload CMS dan file palsu/berbahaya. Aktivasi migrasi Supabase mengikuti CP-04. T012 sedang dikerjakan.

### T012

- [x] **Lindungi pembacaan file dan turunannya**

**Hasil:** Sajikan file asli, thumbnail/transformasi, dan PDF melalui pemeriksaan izin yang konsisten.

**Dependensi:** T011  
**Acuan PRD:** §8.6; AC-06  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/api/media/*; src/media/access.*; src/media/transforms.*; tests/integration/media-read.*

**Kriteria selesai:**

- [x] Pengunjung tidak menerima byte file draft melalui seluruh bentuk URL termasuk permintaan parsial/varian ukuran.
- [x] Pemilik/assignee/Admin dapat melihat file privat yang diizinkan; akun lain ditolak.
- [x] Transformasi dan cache gambar tidak menjadi jalur bypass; PDF diunduh dengan header yang tepat.

**Verifikasi:** Uji URL asli, thumbnail, transformasi, dan PDF secara langsung sebagai anonim serta pengguna lain; periksa byte dan header/cache.

**Bukti/status:** Selesai. [Laporan T012/CP-04](../docs/reports/T012.md): 16 unit, 11 integration, 16 e2e, lint/build/TypeScript dan verifikasi localhost lulus. Migrasi media Supabase diterapkan; file pengembangan tetap kosong. CP-04 ditinjau.

#### CP-04 — setelah T012

- [x] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [x] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [x] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T013

- [x] **Ajukan dan tarik pengajuan artikel**

**Hasil:** Tambahkan transisi draft/revision_required→in_review serta penarikan pengajuan ke draft.

**Dependensi:** T010, T011, T012  
**Acuan PRD:** §8.4; AC-01; AC-27  
**Ukuran:** M  
**File yang mungkin disentuh:** src/editorial/submit.*; src/editorial/withdraw-submission.*; src/media/references.*; tests/integration/review-submit.*

**Kriteria selesai:**

- [x] Pengajuan menyimpan identitas versi dan daftar aset; isi in_review terkunci untuk semua peran.
- [x] Owner/assignee dapat mengajukan/menarik; editor lain ditolak.
- [x] Referensi aset privat tanpa izin ditolak saat simpan dan submit; audit pengajuan dibuat server.

**Verifikasi:** Tes request langsung dengan ID aset pengguna lain, edit versi terkunci, submit ulang, dan tarik pengajuan.

**Bukti/status:** Implementasi/uji selesai. [Laporan T013](../docs/reports/T013.md): 17 unit, 13 integration, Local API guard dan 16 e2e lulus. Pengajuan/withdraw, lock versi, manifest aset dan spoofing diuji. Aktivasi hosted pada CP-05. T014 sedang dikerjakan.

### T014

- [x] **Kembalikan artikel untuk revisi**

**Hasil:** Sediakan tindakan Admin meminta revisi dan menampilkan catatannya ke editor yang berizin.

**Dependensi:** T013  
**Acuan PRD:** §8.4; AC-04  
**Ukuran:** M  
**File yang mungkin disentuh:** src/editorial/request-revision.*; src/collections/ContentReviews.ts; src/audit/access.*; tests/integration/review-revision.*

**Kriteria selesai:**

- [x] Hanya Admin dapat mengubah in_review ke revision_required; catatan revisi wajib.
- [x] Editor terkait dapat membaca catatan dan mengedit revisi; publik tidak memperoleh catatan.
- [x] Riwayat keputusan tidak dapat dibuat/diubah dari payload klien biasa.

**Verifikasi:** Tes Media memalsukan decision/reviewer, Admin tanpa catatan, serta akses audit oleh publik/pengguna lain.

**Bukti/status:** Implementasi/uji selesai. [Laporan T014](../docs/reports/T014.md): 18 unit, 14 integration dan 17 e2e lulus. Catatan Admin wajib, reviewer server, akses catatan CMS, edit/resubmit dan privasi dua Media diuji. Aktivasi hosted bersama CP-05. T015 sedang dikerjakan.

### T015

- [x] **Terbitkan versi artikel yang disetujui**

**Hasil:** Bangun satu operasi persetujuan Admin yang menerbitkan versi beserta referensi aset dan auditnya.

**Dependensi:** T013, T014  
**Acuan PRD:** §8.3–8.4; AC-02; AC-07; AC-25  
**Ukuran:** M  
**File yang mungkin disentuh:** src/editorial/publish.*; src/media/approval.*; src/audit/write.*; tests/integration/publish.*

**Kriteria selesai:**

- [x] Hanya Admin menyetujui versi in_review yang masih cocok; field status/publish tidak dapat dibypass lewat API.
- [x] Versi publik, izin aset, dan audit konsisten; kegagalan storage/database tidak menghasilkan publikasi parsial.
- [x] File yang disetujui tidak dapat ditimpa; alt/caption publik berasal dari versi yang disetujui.

**Verifikasi:** Tes sukses dan rollback dengan fault injection; tes bypass REST serta jalur internal/GraphQL jika diekspos.

**Bukti/status:** Selesai. [Laporan T015/CP-05](../docs/reports/T015.md): 16 integration, 17 e2e, lint/typecheck/build lulus; fault storage/audit rollback terbukti. Hosted migration dan probe localhost lulus, CP-05 ditinjau. T016 sedang dikerjakan.

#### CP-05 — setelah T015

- [x] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [x] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [x] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T016

- [x] **Baca hanya versi publik artikel**

**Hasil:** Buat pembacaan publik terpusat dengan field whitelist untuk daftar/detail serta relasi yang aman.

**Dependensi:** T015  
**Acuan PRD:** §8.3; AC-05  
**Ukuran:** M  
**File yang mungkin disentuh:** src/content/public-read.*; src/access/public.*; tests/integration/public-read.*

**Kriteria selesai:**

- [x] Draft tidak muncul pada hasil, hitungan, detail, atau relasi; detail tanpa publikasi mengembalikan 404.
- [x] Email akun, ownership, audit, dan bukti privat tidak ikut respons publik.
- [x] Nama/isi target relasi diambil dari versi publik target, tanpa mengekspose draftnya.

**Verifikasi:** Tes request anonim termasuk nested relations, filter, count, API bawaan CMS yang diaktifkan, dan ID yang ditebak.

**Bukti/status:** Implementasi/uji selesai. [Laporan T016](../docs/reports/T016.md): 19 unit, 18 integration dan 17 e2e lulus; whitelist rekursif, draft/count/search/filter, relasi target publik dan private shadow draft diuji. Aktivasi hosted pada CP-06. T017 sedang dikerjakan.

### T017

- [x] **Revisi artikel tanpa mengubah versi publik**

**Hasil:** Buat satu revisi kerja dari artikel terbit dan terbitkan ulang melalui alur yang sama.

**Dependensi:** T015, T016  
**Acuan PRD:** §8.3; AC-08  
**Ukuran:** M  
**File yang mungkin disentuh:** src/editorial/create-revision.*; src/editorial/publish.*; src/editorial/archive-revision.*; tests/integration/published-revision.*

**Kriteria selesai:**

- [x] Judul, isi, metadata, slug, dan aset versi publik lama tetap tampil selama revisi.
- [x] Maksimum satu revisi kerja aktif; slug tidak berubah setelah publikasi pertama.
- [x] Persetujuan baru mengganti versi secara utuh; pengarsipan revisi saja tidak menarik versi publik.

**Verifikasi:** Bandingkan respons publik sebelum/saat/setelah revisi dan dua permintaan membuat revisi bersamaan.

**Bukti/status:** Implementasi/uji selesai. [Laporan T017](../docs/reports/T017.md): 20 unit, 20 integration dan 17 e2e lulus. Snapshot publik tetap, CAS 200/409, slug terkunci, clone tanpa child ID sumber dan archive working diuji. Aktivasi hosted pada CP-06. T018 sedang dikerjakan.

### T018

- [x] **Tarik publikasi dan bersihkan cache**

**Hasil:** Tambahkan penarikan publikasi dengan alasan, pembatalan review tertunda, dan invalidasi representasi publik.

**Dependensi:** T016, T017  
**Acuan PRD:** §8.5; AC-10; AC-26  
**Ukuran:** M  
**File yang mungkin disentuh:** src/editorial/unpublish.*; src/content/invalidation.*; src/content/dependencies.*; tests/integration/unpublish.*

**Kriteria selesai:**

- [x] Hanya Admin menarik; detail menjadi 404 dan daftar/hitungan/metadata/cache tidak lagi menampilkan konten.
- [x] Pengajuan revisi tertunda dibatalkan; penerbitan ulang harus melalui pengajuan baru.
- [x] Target relasi wajib yang masih dipakai tidak dapat ditarik; dependensi ditampilkan dan relasi opsional ke target yang ditarik disembunyikan.

**Verifikasi:** Panaskan cache lalu tarik artikel; tes audit, revisi tertunda, serta fixture relasi wajib/opsional. Ulangi setelah sitemap tersedia.

**Bukti/status:** Selesai. [Laporan T018/CP-06](../docs/reports/T018.md): 23 integration dan 18 e2e lulus, termasuk browser cache, dependency wajib/opsional, review cancellation dan restart fresh review. Migrasi, lint/build/TypeScript dan probe produksi localhost 3200 lulus. CP-06 ditinjau. T019 sedang dikerjakan.

#### CP-06 — setelah T018

- [x] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [x] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [x] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T019

- [x] **Kelola akses aset yang digunakan ulang**

**Hasil:** Hitung penggunaan aset pada versi publik/konfigurasi dan cabut akses setelah referensi publik terakhir hilang.

**Dependensi:** T012, T015, T018  
**Acuan PRD:** §8.6; AC-11; AC-27  
**Ukuran:** M  
**File yang mungkin disentuh:** src/media/references.*; src/media/access.*; src/content/invalidation.*; tests/integration/media-reuse.*

**Kriteria selesai:**

- [x] Aset publik dapat digunakan ulang tanpa meminjam izin aset privat.
- [x] Menarik satu dari dua konten tidak menutup aset; penarikan referensi terakhir menutup asli dan seluruh turunan/cache.
- [x] Aset yang dicabut setelah submit membuat persetujuan baru ditolak sampai referensi diperbaiki.

**Verifikasi:** Tes dua artikel berbagi gambar/PDF dan akses langsung setelah masing-masing ditarik.

**Bukti/status:** Selesai. [Laporan T019](../docs/reports/T019.md): 25 integration dan Local API lulus; reuse dua artikel/gambar/PDF, last-reference withdrawal dan revoke setelah submit terbukti. T020 sedang dikerjakan.

### T020

- [x] **Amankan hapus dan pencabutan darurat**

**Hasil:** Sediakan tindakan Admin menghapus aset/draft yang memenuhi syarat dan mencabut media darurat.

**Dependensi:** T019  
**Acuan PRD:** §8.5–8.6; AC-12  
**Ukuran:** M  
**File yang mungkin disentuh:** src/media/delete.*; src/media/revoke.*; src/editorial/delete-draft.*; tests/integration/deletion.*

**Kriteria selesai:**

- [x] Penghapusan media yang dirujuk draft, riwayat versi, publikasi, atau konfigurasi ditolak dengan daftar referensi.
- [x] Pencabutan darurat menghentikan akses file dan menunjukkan fallback serta konten terdampak.
- [x] Media tidak dapat menghapus; konten pernah terbit/audit tidak dihapus permanen; draft belum terbit tanpa referensi boleh dihapus Admin dengan audit.

**Verifikasi:** Tes masing-masing jenis referensi, URL lama, fallback publik, serta percobaan hapus melalui API.

**Bukti/status:** Selesai. [Laporan T020](../docs/reports/T020.md): 20 unit, 30 integration dan 18 e2e lulus. Guard seluruh referensi, revoke/fallback, tombstone draft/audit, rollback dan cleanup retry terbukti. Migrasi Supabase dan build/CMS produksi lokal terverifikasi; T021 siap.

### T021

- [ ] **Tolak konflik review dan kunci audit**

**Hasil:** Lengkapi kontrol keputusan bersamaan dan histori audit append-only.

**Dependensi:** T014, T015, T017, T018  
**Acuan PRD:** §8.4; §8.8; AC-09  
**Ukuran:** M  
**File yang mungkin disentuh:** src/editorial/concurrency.*; src/audit/*; tests/integration/editorial-races.*

**Kriteria selesai:**

- [ ] Dua keputusan atas versi yang sama tidak sama-sama berhasil; persetujuan usang ditolak.
- [ ] Edit bersamaan tidak menimpa perubahan tanpa pemberitahuan konflik.
- [ ] Riwayat menyimpan actor/waktu/versi/status/alasan; edit/hapus audit lewat CMS/API ditolak bahkan bagi Admin.

**Verifikasi:** Tes paralel terkoordinasi, rollback, audit setelah restart, dan manipulasi request audit.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-07 — setelah T021

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T022

- [ ] **Tampilkan antrean review dan preview privat**

**Hasil:** Hubungkan tindakan server yang sudah diuji ke Payload Admin menggunakan tampilan minimum.

**Dependensi:** T013, T014, T015, T017, T018, T020, T021  
**Acuan PRD:** §6.2; §8.1–8.4  
**Ukuran:** M  
**File yang mungkin disentuh:** src/admin/review/*; src/admin/preview/*; src/collections/Articles.ts; tests/e2e/editorial-ui.*

**Kriteria selesai:**

- [ ] Editor melihat status dan catatan konten berizin; Admin mendapat antrean in_review dan tindakan yang sesuai.
- [ ] Preview memerlukan login dan izin; tidak ada preview publik atau data privat dalam URL berbagi.
- [ ] Status gagal/konflik jelas dan tidak memberi kesan publikasi berhasil.

**Verifikasi:** Demo kedua role di browser lalu uji bypass endpoint; gunakan komponen CMS bawaan bila cukup.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T023

- [ ] **Buat daftar artikel yang bisa dicari**

**Hasil:** Bangun daftar publik dengan pencarian judul/excerpt, kategori, pagination, serta empty state.

**Dependensi:** T009, T016  
**Acuan PRD:** FR-04; AC-18  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/publikasi/artikel/page.tsx; src/components/publications/*; src/content/article-search.*; tests/e2e/article-list.*

**Kriteria selesai:**

- [ ] Pencarian case-insensitive, kategori dan pagination dapat digabung; default 12 dan maksimum 48.
- [ ] Kategori tidak dikenal/hasil kosong/halaman di luar rentang ditangani sesuai PRD; parameter tidak valid memakai default.
- [ ] Hanya versi terbit memengaruhi isi dan hitungan hasil.

**Verifikasi:** Tes query kombinasi dan browser mobile/keyboard; gunakan fixture draft berjudul serupa untuk membuktikan tidak bocor.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T024

- [ ] **Buat detail artikel dan renderer aman**

**Hasil:** Render isi artikel, penulis publik, tanggal, sampul, sumber, dan disclaimer tanpa konten aktif berbahaya.

**Dependensi:** T009, T012, T016, T023  
**Acuan PRD:** FR-04; §8.8; AC-23  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/publikasi/artikel/[slug]/page.tsx; src/components/RichText.tsx; src/validation/links.*; tests/e2e/article-detail.*

**Kriteria selesai:**

- [ ] Rich text mempertahankan heading/link/gambar yang sah tanpa script atau iframe bebas.
- [ ] Tautan hanya memakai skema yang diizinkan dan rel yang aman; 404 tidak membocorkan draft.
- [ ] Tanggal publikasi jelas, alt terbaca, dan label contoh tampil saat data demo digunakan.

**Verifikasi:** Uji payload rich text/URL berbahaya, detail draft, tautan eksternal, serta navigasi keyboard.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-08 — setelah T024

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T025

- [ ] **Buktikan alur artikel lengkap**

**Hasil:** Jalankan skenario Admin/dua Media/pengunjung sebelum memperluas pola ke modul lain.

**Dependensi:** T007, T008, T019, T020, T021, T022, T023, T024  
**Acuan PRD:** FR-04; AC-01; AC-02; AC-03; AC-04; AC-05; AC-06; AC-07; AC-08; AC-09; AC-10; AC-11; AC-12; AC-13; AC-25; AC-27  
**Ukuran:** M  
**File yang mungkin disentuh:** tests/e2e/article-workflow.*; tests/integration/editorial-regression.*; docs/qa/article-slice.md

**Kriteria selesai:**

- [ ] Draft→review→revisi→publish→revisi baru→withdraw terbukti pada UI serta request langsung.
- [ ] Tes negatif akses konten/file, konflik, dan kegagalan publish lulus; hasil dicatat.
- [ ] Jika bukti versi/media gagal, perbaiki arsitektur sebelum modul berikutnya; jangan mengganti dengan status field saja.

**Verifikasi:** Jalankan suite integrasi editorial dan E2E artikel pada build production lokal; simpan hasil dan batasan.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-09 — setelah T025

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

## Fase C — Modul publik P0 lainnya

Pages, organisasi, riset, kegiatan, rekrutmen, kontak, dan homepage P0 terhubung ke workflow yang terbukti.

### T026

- [ ] **Buat konten Pages dengan review**

**Hasil:** Tambahkan Pages dengan pageKey homepage/about dan blok isi minimum, memakai workflow artikel yang sudah terbukti.

**Dependensi:** T025  
**Acuan PRD:** FR-01; FR-02; §8.7  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Pages.ts; src/blocks/*; tests/integration/pages.*

**Kriteria selesai:**

- [ ] Homepage/About masing-masing memiliki identitas tunggal; isi tidak diduplikasi di global settings.
- [ ] Media berizin menyunting lewat review; versi terbit tetap konsisten selama revisi.
- [ ] Blok mendukung hero/profil/program/CTA dan SEO tanpa menjalankan HTML bebas.

**Verifikasi:** Tes Pages draft/publish/revisi dan duplikasi pageKey; belum wajib melengkapi homepage agregasi.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T027

- [ ] **Kelola Site Settings oleh Admin**

**Hasil:** Bangun global identitas, kontak terkonfirmasi, sosial, navigasi, dan footer yang langsung diaudit.

**Dependensi:** T020, T025, T026  
**Acuan PRD:** §8.7; FR-10; AC-21  
**Ukuran:** M  
**File yang mungkin disentuh:** src/globals/SiteSettings.ts; src/validation/navigation.*; src/media/references.*; tests/integration/settings.*

**Kriteria selesai:**

- [ ] Media ditolak melalui UI/API; perubahan Admin mencatat audit tanpa menggandakan isi Pages.
- [ ] Logo/favicon privat memperoleh izin publik hanya lewat penyimpanan konfigurasi Admin yang sah.
- [ ] URL internal/HTTPS/email tervalidasi; kontak kosong/tidak terkonfirmasi tidak diperlakukan resmi.

**Verifikasi:** Uji request role, spoofing konfirmasi, pergantian logo, dan referensi media konfigurasi terhadap penghapusan/pencabutan.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-10 — setelah T027

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T028

- [ ] **Tampilkan Tentang dan layout dari CMS**

**Hasil:** Hubungkan About, header, navigasi, footer, dan kontak bersama ke versi publik/konfigurasi.

**Dependensi:** T009, T026, T027  
**Acuan PRD:** FR-02; FR-10; AC-21  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/tentang/page.tsx; src/app/(public)/layout.tsx; src/components/navigation/*; tests/e2e/about-settings.*

**Kriteria selesai:**

- [ ] /tentang menampilkan profil/sejarah/visi/misi dari CMS tanpa login.
- [ ] Header/footer mengambil kontak dan navigasi yang sama; menu tetap dapat dioperasikan pada mobile/keyboard.
- [ ] Revisi About belum disetujui tidak mengubah publik; bagian kosong memiliki fallback.

**Verifikasi:** Ubah Pages dan settings melalui kedua role, bandingkan hasil publik serta menu pada mobile.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T029

- [ ] **Kelola periode organisasi melalui review**

**Hasil:** Tambahkan periode dengan label/tanggal dan riwayat terbit, tanpa menyamakan isi editorial dengan pilihan aktif.

**Dependensi:** T025  
**Acuan PRD:** FR-03; §12; AC-16  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/OrganizationalPeriods.ts; src/validation/dates.*; tests/integration/periods.*

**Kriteria selesai:**

- [ ] Label periode unik; rentang tanggal valid dan tanggal kalender tidak bergeser hari.
- [ ] Periode mengikuti ownership/review/publikasi yang sama; draft tidak tersedia ke publik.
- [ ] Riwayat versi/periode tersimpan; penghapusan periode yang dirujuk ditolak.

**Verifikasi:** Tes CRUD berizin, review, tanggal, dan referensi periode dengan fixture dependen.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T030

- [ ] **Publikasikan delapan profil divisi**

**Hasil:** Tambahkan divisi dan halaman daftar/detail dengan deskripsi serta program kerja yang bisa direview.

**Dependensi:** T009, T025, T029  
**Acuan PRD:** FR-03  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Divisions.ts; src/app/(public)/tentang/divisi/*; tests/integration/divisions.*; tests/e2e/divisions.*

**Kriteria selesai:**

- [ ] Seluruh delapan nama divisi PRD dapat dikelola dan diurutkan; contoh diberi label.
- [ ] /tentang/divisi dan /tentang/divisi/[slug] membaca hanya profil terbit.
- [ ] Media dapat mengedit divisi yang ditugaskan tanpa menerbitkan sendiri; syarat rekrutmen tidak dipaksakan ke profil.

**Verifikasi:** Tes review satu divisi dan browser daftar/detail; fixture meliputi delapan divisi tanpa mengklaim data pengurus resmi.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-11 — setelah T030

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T031

- [ ] **Tampilkan pengurus berdasarkan periode**

**Hasil:** Kelola anggota publik dengan periode wajib, divisi opsional, jabatan, foto, dan urutan; buat halaman struktur.

**Dependensi:** T009, T029, T030  
**Acuan PRD:** FR-03; AC-16; AC-26  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Members.ts; src/app/(public)/tentang/struktur/page.tsx; tests/integration/members.*; tests/e2e/structure.*

**Kriteria selesai:**

- [ ] Jabatan organisasi tanpa divisi tetap dapat ditampilkan; periode tidak boleh kosong.
- [ ] Halaman /tentang/struktur menampilkan pengurus terbit per periode dan menyediakan akses periode lampau.
- [ ] Relasi wajib ke periode privat/ditarik ditolak; foto privat dan metadata akun tidak bocor.

**Verifikasi:** Tes anggota pada dua periode, jabatan tanpa divisi, revisi relasi, serta penarikan target periode yang masih dipakai.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T032

- [ ] **Pilih satu periode aktif secara aman**

**Hasil:** Sediakan kontrol operasional Admin untuk periode aktif dengan invariant yang tahan request bersamaan.

**Dependensi:** T029, T031  
**Acuan PRD:** §8.8; AC-16; AC-28  
**Ukuran:** M  
**File yang mungkin disentuh:** src/organization/active-period.*; src/admin/period-control.*; tests/integration/period-activation.*

**Kriteria selesai:**

- [ ] Hanya periode terbit dapat dipilih; maksimum satu aktif meskipun dua request berlangsung bersamaan.
- [ ] Pilihan aktif terpisah dari revisi isi; perpindahan tidak menghapus periode/pengurus lama.
- [ ] Penarikan periode aktif yang sah mengosongkan pilihan; dependensi wajib tetap menghalangi penarikan.

**Verifikasi:** Tes aktivasi draft, aktivasi paralel, perpindahan, dan penarikan dengan/tanpa dependensi publik.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T033

- [ ] **Kelola riset dengan disclaimer wajib**

**Hasil:** Tambahkan riset beserta kategori, analisis date-only, referensi, tim publik, dan PDF opsional.

**Dependensi:** T025  
**Acuan PRD:** FR-05; AC-20  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/ResearchPublications.ts; src/collections/Categories.ts; src/content/research-policy.*; tests/integration/research.*

**Kriteria selesai:**

- [ ] Kategori riset awal tersedia; sumber/tanggal analisis diperiksa sebelum publikasi.
- [ ] Disclaimer dasar tidak bisa dihapus editor; catatan tambahan tidak menggantikannya.
- [ ] Lampiran PDF dan sampul mengikuti izin/approval versi; owner CMS terpisah dari tim publik.

**Verifikasi:** Tes publikasi tanpa tanggal/disclaimer, perubahan lampiran sebelum approval, dan date-only lintas zona waktu.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-12 — setelah T033

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T034

- [ ] **Tampilkan daftar dan detail riset**

**Hasil:** Bangun pencarian/filter kategori riset, detail analisis, referensi, disclaimer tetap, dan unduhan.

**Dependensi:** T009, T012, T023, T024, T033  
**Acuan PRD:** FR-05; AC-18; AC-20  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/publikasi/riset/*; src/components/research/*; tests/e2e/research.*

**Kriteria selesai:**

- [ ] /publikasi/riset dan detail menampilkan hanya versi terbit dengan pagination sesuai PRD.
- [ ] Tanggal analisis dibedakan dari tanggal publikasi; disclaimer selalu ada pada detail.
- [ ] PDF yang diunduh sama dengan versi yang disetujui; lampiran kosong tidak membuat tombol rusak.

**Verifikasi:** Uji query, mobile, revisi belum terbit, disclaimer, tanggal analisis, dan URL PDF langsung.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T035

- [ ] **Kelola event dan aturan waktunya**

**Hasil:** Buat collection event, validasi waktu/lokasi/link, dan kalkulasi status memakai waktu server.

**Dependensi:** T025  
**Acuan PRD:** FR-06; §8.8; AC-15  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Events.ts; src/events/status.*; src/validation/links.*; tests/unit/event-time.*; tests/integration/events.*

**Kriteria selesai:**

- [ ] startAt/endAt valid, endAt lebih besar; waktu CMS jelas dalam WIB.
- [ ] Upcoming/ongoing/completed ditentukan batas waktu; cancelled terpisah.
- [ ] Status pendaftaran dan URL terkonfirmasi menjadi syarat CTA; perubahan isi/status editorial mengikuti review.

**Verifikasi:** Tes tepat sebelum/saat/sesudah mulai dan selesai, pembatalan, URL tidak valid, dan input WIB ke UTC.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T036

- [ ] **Tampilkan daftar dan detail kegiatan**

**Hasil:** Buat halaman event dengan filter status, arsip selesai, detail, dan tombol pendaftaran bersyarat.

**Dependensi:** T009, T035  
**Acuan PRD:** FR-06; AC-15  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/kegiatan/*; src/components/events/*; tests/e2e/events.*

**Kriteria selesai:**

- [ ] /kegiatan dan detail membaca event terbit; event selesai tetap dapat dibaca.
- [ ] CTA hanya tersedia jika seluruh syarat waktu/pendaftaran/URL terpenuhi dan event tidak batal.
- [ ] Cache tidak mempertahankan CTA setelah batas waktu; keterangan pembatalan jelas.

**Verifikasi:** Uji browser dengan clock terkendali dan cache yang sudah hangat, tautan eksternal, serta event draft.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-13 — setelah T036

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T037

- [ ] **Kelola kampanye dan posisi rekrutmen**

**Hasil:** Tambahkan kampanye yang merujuk periode organisasi, posisi/divisi, syarat, tahapan, jadwal, dan URL.

**Dependensi:** T029, T030, T032, T025  
**Acuan PRD:** FR-08; AC-14  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/RecruitmentPeriods.ts; src/recruitment/validation.*; tests/integration/recruitment.*

**Kriteria selesai:**

- [ ] Syarat per posisi dan tahapan dapat diubah melalui CMS/review; periode wajib memiliki publikasi sah.
- [ ] opensAt/closesAt valid dengan zona waktu yang jelas; field URL tunduk validasi/konfirmasi.
- [ ] Menyimpan/menerbitkan isi tidak otomatis mengaktifkan kampanye.

**Verifikasi:** Tes nested positions, relasi periode/divisi, jadwal, serta pengajuan/revisi rekrutmen melalui kedua role.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T038

- [ ] **Batasi aktivasi satu kampanye**

**Hasil:** Tambahkan kontrol Admin enabledByAdmin di luar versi editorial dengan audit dan invariant konkuren.

**Dependensi:** T037  
**Acuan PRD:** §8.8; AC-29  
**Ukuran:** M  
**File yang mungkin disentuh:** src/recruitment/activation.*; src/admin/recruitment-control.*; tests/integration/recruitment-activation.*

**Kriteria selesai:**

- [ ] Hanya kampanye terbit dapat diaktifkan; maksimum satu enabled termasuk kampanye mendatang/berakhir.
- [ ] Dua aktivasi bersamaan tidak menghasilkan dua kampanye enabled; Media tidak dapat memanipulasi flag.
- [ ] Penarikan otomatis menonaktifkan; lewat waktu tutup menyembunyikan CTA tanpa diam-diam mengganti flag.

**Verifikasi:** Tes draft, race dua Admin, rentang tumpang tindih, kampanye mendatang, dan penarikan aktif.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T039

- [ ] **Tampilkan rekrutmen dan CTA tepat waktu**

**Hasil:** Bangun halaman posisi, persyaratan, tahapan, serta status belum dibuka/terbuka/ditutup.

**Dependensi:** T009, T037, T038  
**Acuan PRD:** FR-08; AC-14; AC-29  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/rekrutmen/page.tsx; src/recruitment/public-state.*; tests/e2e/recruitment.*

**Kriteria selesai:**

- [ ] /rekrutmen memakai kampanye terbit dan status operasional yang sah; informasi riwayat dapat dibaca tanpa CTA aktif.
- [ ] Tombol hanya ada saat enabled, dalam rentang waktu, dan URL valid/terkonfirmasi.
- [ ] Tepat waktu tutup tombol hilang walaupun halaman pernah di-cache; URL tersimpan saja tidak cukup.

**Verifikasi:** Uji batas buka/tutup server, nonaktif, URL kosong, dan revisi belum disetujui di browser mobile.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-14 — setelah T039

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T040

- [ ] **Tampilkan kontak terkonfirmasi**

**Hasil:** Buat halaman kontak dan konsistensi sumber kontak di seluruh komponen publik.

**Dependensi:** T027, T028  
**Acuan PRD:** FR-10; AC-21  
**Ukuran:** S  
**File yang mungkin disentuh:** src/app/(public)/kontak/page.tsx; src/components/ContactLinks.tsx; tests/e2e/contact.*

**Kriteria selesai:**

- [ ] /kontak menampilkan hanya email/sosial/lokasi terkonfirmasi; kosong memiliki pesan yang wajar.
- [ ] Header/footer/halaman kontak tidak menyimpan salinan konfigurasi terpisah.
- [ ] Tidak ada formulir kontak atau pengiriman email otomatis yang menambah scope.

**Verifikasi:** Ubah satu kontak lewat Admin lalu periksa semua lokasi tampil, link mailto/HTTPS, dan kondisi belum terkonfirmasi.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T041

- [ ] **Buat pintu masuk publikasi**

**Hasil:** Bangun /publikasi sebagai pengarah artikel dan riset dengan ringkasan versi terbit.

**Dependensi:** T023, T024, T034  
**Acuan PRD:** FR-04; FR-05; §6.1  
**Ukuran:** S  
**File yang mungkin disentuh:** src/app/(public)/publikasi/page.tsx; src/components/publications/*; tests/e2e/publications-index.*

**Kriteria selesai:**

- [ ] Tautan jenis publikasi dan item terbaru menuju rute benar; draft tidak ikut tampil.
- [ ] Tidak ada duplikasi konten artikel/riset yang harus diperbarui manual; empty state jelas.

**Verifikasi:** Tes kedua jenis publikasi kosong/terisi dan navigasi keyboard/mobile.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T042

- [ ] **Hubungkan homepage dengan modul P0**

**Hasil:** Lengkapi homepage tahap P0 dengan isi Pages, profil/program, artikel/riset terbaru, event terdekat, dan CTA.

**Dependensi:** T026, T028, T030, T032, T034, T036, T039, T040, T041  
**Acuan PRD:** FR-01  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/page.tsx; src/content/homepage.*; src/components/home/*; tests/e2e/homepage-p0.*

**Kriteria selesai:**

- [ ] Seluruh isi editorial berasal dari versi disetujui; daftar terbaru terurut sesuai PRD.
- [ ] CTA kegiatan/publikasi/rekrutmen menuju rute valid dan tidak menawarkan pendaftaran yang ditutup.
- [ ] Bagian prestasi/mitra yang belum tersedia ditangani tanpa informasi fiktif atau layout rusak.

**Verifikasi:** Tes homepage dengan dataset kosong/terisi dan pergantian jadwal/kampanye pada cache yang sudah hangat.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-15 — setelah T042

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

## Fase D — Modul P1 dan homepage lengkap

Galeri, partnership, prestasi, dan agregasi homepage selesai tanpa mengurangi izin.

### T043

- [ ] **Kelola album dokumentasi privat**

**Hasil:** Tambahkan galeri, relasi event opsional, urutan foto/alt/caption, tanggal kegiatan, dan tautan video HTTPS.

**Dependensi:** T025, T035  
**Acuan PRD:** FR-07; AC-24; AC-27  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Galleries.ts; src/media/gallery-policy.*; tests/integration/galleries.*

**Kriteria selesai:**

- [ ] Album menggunakan workflow versi/review dan izin media yang sama; foto informatif wajib alt.
- [ ] Relasi event opsional yang tidak publik tidak membocorkan draft; file tidak dapat dipasang dengan ID privat tanpa izin.
- [ ] Video hanya tautan; tanggal kegiatan tidak bergeser hari.

**Verifikasi:** Tes album multi-foto, revisi caption, aset lintas owner, event ditarik, serta video URL berbahaya.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T044

- [ ] **Tampilkan daftar dan detail galeri**

**Hasil:** Bangun /galeri dan detail album yang responsif dengan gambar yang diizinkan.

**Dependensi:** T009, T012, T043  
**Acuan PRD:** FR-07; AC-24  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/galeri/*; src/components/gallery/*; tests/e2e/gallery.*

**Kriteria selesai:**

- [ ] Daftar/detail hanya membaca album terbit dan versi foto/alt yang disetujui.
- [ ] Grid dapat dibaca pada mobile; navigasi gambar, bila disediakan, mendukung keyboard dan fokus.
- [ ] Aset dicabut mendapat fallback; video eksternal dibuka aman tanpa embed bebas.

**Verifikasi:** Uji album kosong/multi-foto, revisi draft, pencabutan foto, mobile, dan keyboard.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T045

- [ ] **Kelola mitra dengan izin logo**

**Hasil:** Tambahkan mitra, kolaborasi, website, pilihan homepage, dan pencatatan izin logo yang privat.

**Dependensi:** T025  
**Acuan PRD:** FR-09; AC-24  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Partners.ts; src/partners/logo-policy.*; tests/integration/partners.*

**Kriteria selesai:**

- [ ] Nama/deskripsi mengikuti review; hanya Admin mencatat izin logo beserta pelaksana/waktu.
- [ ] Bukti izin tidak masuk respons/relasi publik; Media tidak dapat memalsukan konfirmasi.
- [ ] Logo tidak ditampilkan jika izin belum ada, meskipun file tersebut sudah publik untuk konteks lain.

**Verifikasi:** Tes approval konten tanpa izin logo, pemalsuan flag melalui API, dan pembacaan bukti privat secara anonim.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-16 — setelah T045

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T046

- [ ] **Tampilkan partnership publik**

**Hasil:** Buat /partnership dengan nama, kolaborasi, website, dan logo yang memenuhi izin.

**Dependensi:** T009, T045  
**Acuan PRD:** FR-09; AC-24  
**Ukuran:** S  
**File yang mungkin disentuh:** src/app/(public)/partnership/page.tsx; src/components/partners/*; tests/e2e/partnership.*

**Kriteria selesai:**

- [ ] Hanya mitra terbit ditampilkan; nama/deskripsi tanpa logo tetap terbaca bila disetujui.
- [ ] Website memakai HTTPS valid/rel aman; contoh tidak menyiratkan kemitraan resmi.

**Verifikasi:** Uji mitra dengan/tanpa izin logo, URL kosong, draft, serta label contoh.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T047

- [ ] **Kelola dan tampilkan prestasi**

**Hasil:** Buat collection serta halaman prestasi dengan tanggal, kategori, penerima/tim, dokumentasi, dan filter tahun.

**Dependensi:** T009, T025  
**Acuan PRD:** FR-11; AC-24  
**Ukuran:** M  
**File yang mungkin disentuh:** src/collections/Achievements.ts; src/app/(public)/prestasi/page.tsx; src/content/achievement-query.*; tests/e2e/achievements.*

**Kriteria selesai:**

- [ ] Admin/Media menjalankan review prestasi; hanya versi terbit muncul di /prestasi.
- [ ] Filter tahun memakai tanggal kalender yang benar; revisi/penarikan tidak menghapus audit.
- [ ] Dokumentasi mengikuti izin media; contoh prestasi diberi label.

**Verifikasi:** Tes dua tahun, hasil kosong, tanggal di batas tahun, review, dan penarikan dokumentasi.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T048

- [ ] **Lengkapi homepage dengan modul P1**

**Hasil:** Tambahkan prestasi dan mitra terpilih pada homepage dengan kondisi publikasi/izin yang benar.

**Dependensi:** T042, T044, T046, T047  
**Acuan PRD:** FR-01; FR-09; FR-11  
**Ukuran:** M  
**File yang mungkin disentuh:** src/content/homepage.*; src/components/home/*; tests/e2e/homepage-complete.*

**Kriteria selesai:**

- [ ] Bagian prestasi/mitra bersumber dari data CMS terbit; logo selalu mengikuti izin.
- [ ] Homepage lengkap memenuhi semua bagian FR-01 tanpa menambah statistik yang belum dikonfirmasi.
- [ ] Penarikan mitra/prestasi atau pencabutan logo memperbarui homepage termasuk cache.

**Verifikasi:** Periksa homepage lengkap di browser; tarik data/izin lalu periksa hasil dan empty state.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-17 — setelah T048

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

## Fase E — Seed dan verifikasi menyeluruh

Data demo final, SEO, keamanan, aksesibilitas, dan performa memiliki bukti.

### T049

- [ ] **Siapkan seed demo lengkap yang aman**

**Hasil:** Lengkapi seed seluruh modul dengan konten contoh, delapan divisi, dua periode, dua role, dan aset yang sah digunakan.

**Dependensi:** T032, T034, T036, T039, T040, T044, T046, T047, T048  
**Acuan PRD:** §11.3; §17; AC-22  
**Ukuran:** M  
**File yang mungkin disentuh:** scripts/seed.*; src/seed/*; tests/integration/seed.*; docs/demo-data.md

**Kriteria selesai:**

- [ ] Seed aman dijalankan ulang tanpa duplikasi/penimpaan edit; akun memakai secret input, bukan password tetap.
- [ ] Label contoh tampil pada kartu/detail dan metadata berbagi; kontak/mitra/prestasi tidak diklaim resmi.
- [ ] Dataset benchmark deterministik; reset memerlukan opsi eksplisit dan tidak menyasar database produksi.

**Verifikasi:** Jalankan seed dua kali, ubah satu konten, seed ulang, restart database/storage, lalu bandingkan data dan file.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T050

- [ ] **Lengkapi metadata dan canonical**

**Hasil:** Buat judul/deskripsi unik, canonical dari base URL, Open Graph, dan metadata aman pada halaman publik.

**Dependensi:** T027, T034, T036, T039, T044, T046, T047, T048, T049  
**Acuan PRD:** §13 SEO; AC-05  
**Ukuran:** M  
**File yang mungkin disentuh:** src/seo/metadata.*; src/app/(public)/*; tests/integration/seo-metadata.*

**Kriteria selesai:**

- [ ] Seluruh rute publik memiliki metadata sesuai isi; draft/404 tidak membocorkan judul/excerpt/aset privat.
- [ ] Canonical mengikuti environment; localhost tidak diklaim domain resmi produksi.
- [ ] Open Graph konten demo memuat penandaan contoh; konfigurasi base URL tervalidasi.

**Verifikasi:** Periksa HTML server dan metadata pada rute terbit/draft/revisi; bandingkan base URL dua lingkungan lokal uji.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T051

- [ ] **Buat sitemap, robots, dan structured data**

**Hasil:** Bangun indeks mesin pencari dari versi publik dan structured data yang sesuai jenis konten.

**Dependensi:** T050  
**Acuan PRD:** §13 SEO; AC-05; AC-10  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/sitemap.ts; src/app/robots.ts; src/seo/structured-data.*; tests/integration/seo-index.*

**Kriteria selesai:**

- [ ] Sitemap hanya memuat URL terbit; penarikan menghapus URL/metadata terkait termasuk cache.
- [ ] CMS/preview tidak diindeks; mode demo/staging tidak mengizinkan indeks publik.
- [ ] Structured data sesuai isi terbit dan tidak menyatakan organisasi/event contoh sebagai fakta terverifikasi.

**Verifikasi:** Validasi output XML/robots/JSON-LD; uji sesudah publish/withdraw dengan cache hangat dan base URL demo.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-18 — setelah T051

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T052

- [ ] **Lengkapi error handling dan log aman**

**Hasil:** Tambahkan error boundary/status publik, pencatatan kegagalan, dan korelasi request yang tidak mengungkap secret.

**Dependensi:** T025, T027, T048  
**Acuan PRD:** §13 Reliability; AC-25  
**Ukuran:** M  
**File yang mungkin disentuh:** src/app/(public)/error.tsx; src/app/(public)/not-found.tsx; src/logging/*; tests/integration/failure-paths.*

**Kriteria selesai:**

- [ ] Error database/storage tidak mengirim stack trace, token, atau connection string ke publik.
- [ ] Kegagalan publikasi/audit/invalidation tertangani sesuai desain tanpa publikasi parsial.
- [ ] Halaman loading/error/404 memiliki pesan dan navigasi pemulihan; log tetap berguna untuk diagnosis.

**Verifikasi:** Simulasikan kegagalan terkendali pada database/storage/publish dan inspeksi respons/log; jangan matikan layanan di luar lingkungan uji.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T053

- [ ] **Periksa sesi, login, dan input berbahaya**

**Hasil:** Lengkapi pemeriksaan keamanan request lintas situs, cookie/origin, login berulang, rich text, URL, dan input upload.

**Dependensi:** T007, T008, T024, T027, T048  
**Acuan PRD:** §13 Security; AC-02; AC-17; AC-23  
**Ukuran:** M  
**File yang mungkin disentuh:** tests/integration/security/*; tests/e2e/input-safety.*; docs/qa/security.md; konfigurasi auth

**Kriteria selesai:**

- [ ] Percobaan login berulang dibatasi; cookie dan origin sesuai localhost/produksi terdokumentasi.
- [ ] Request lintas situs tidak sah dan input aktif berbahaya tidak mengubah data atau menjalankan script.
- [ ] Role/owner/audit/global settings tidak dapat dimanipulasi melalui jalur API yang diekspos.

**Verifikasi:** Tes request langsung dan browser dengan origin berbeda serta payload berbahaya; lakukan pengecekan dependency pada versi yang benar-benar terpasang saat itu.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T054

- [ ] **Uji matriks izin lintas semua collection**

**Hasil:** Jalankan kontrak akses/workflow yang sama terhadap seluruh collection editorial dan aset, bukan hanya artikel.

**Dependensi:** T025, T032, T034, T036, T039, T044, T046, T047, T051, T053  
**Acuan PRD:** §8; AC-01; AC-02; AC-03; AC-04; AC-05; AC-06; AC-07; AC-08; AC-10; AC-11; AC-12; AC-13; AC-21; AC-24; AC-26; AC-27  
**Ukuran:** M  
**File yang mungkin disentuh:** tests/integration/access-contract.*; tests/integration/relation-contract.*; docs/qa/access-matrix.md

**Kriteria selesai:**

- [ ] Matriks public/owner/assignee/Media lain/Admin mencakup baca, tulis, review, publish, tarik, dan hapus yang relevan.
- [ ] Nested relations, metadata/count, preview, original/derivative/PDF, dan pemalsuan ID aset tetap aman.
- [ ] Relasi membaca target publik terkini; target wajib tidak dapat ditarik saat dirujuk; audit privat tetap terlindungi.

**Verifikasi:** Jalankan suite integrasi terparameterisasi dengan request langsung; catat kegagalan per collection dan perbaiki tanpa menurunkan aturan.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-19 — setelah T054

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T055

- [ ] **Uji batas waktu dan request bersamaan**

**Hasil:** Verifikasi waktu server, date-only, cache, dan invariant aktivasi/review dengan pengujian terkendali.

**Dependensi:** T021, T032, T036, T038, T039, T049  
**Acuan PRD:** §8.8; AC-09; AC-14; AC-15; AC-16; AC-28; AC-29  
**Ukuran:** M  
**File yang mungkin disentuh:** tests/integration/time-boundaries.*; tests/integration/concurrency.*; tests/e2e/time-sensitive-cta.*; docs/qa/time.md

**Kriteria selesai:**

- [ ] Batas event/rekrutmen benar sebelum/saat/sesudah transisi meskipun cache hangat.
- [ ] Tidak ada dua periode aktif, dua kampanye enabled, atau persetujuan usang yang berhasil bersamaan.
- [ ] Tanggal analisis/prestasi/album tidak berubah hari; konflik terlihat dan tidak menimpa perubahan.

**Verifikasi:** Gunakan clock terkendali dan barrier request paralel pada integrasi; periksa efek database serta UI.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T056

- [ ] **Uji responsivitas dan aksesibilitas**

**Hasil:** Periksa seluruh keluarga halaman pada ukuran target dan kemampuan akses dasar, lalu perbaiki temuan terukur.

**Dependensi:** T028, T031, T034, T036, T039, T040, T041, T044, T046, T047, T048, T049  
**Acuan PRD:** §10; AC-19  
**Ukuran:** M  
**File yang mungkin disentuh:** tests/e2e/accessibility.*; docs/qa/accessibility.md; komponen yang terbukti bermasalah

**Kriteria selesai:**

- [ ] Lebar 320/375/768/1024/1440 px tidak menyebabkan scroll halaman horizontal; zoom 200% tetap dapat digunakan.
- [ ] Keyboard, fokus, label/error, heading, alt, kontras, menu/dialog, serta reduced motion diperiksa.
- [ ] Hasil pemeriksaan dan keterbatasan dicatat; alat otomatis tidak dipakai sebagai satu-satunya bukti aksesibilitas.

**Verifikasi:** Jalankan browser nyata, pemeriksaan otomatis yang relevan, dan manual keyboard/zoom; jika perbaikan menyentuh >5 file, pecah menjadi subtugas bernomor turunan.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T057

- [ ] **Ukur performa sesuai kondisi PRD**

**Hasil:** Benchmark empat halaman target pada build production dan dataset demo tetap.

**Dependensi:** T049, T050, T051, T056  
**Acuan PRD:** §13 Performance  
**Ukuran:** S  
**File yang mungkin disentuh:** docs/qa/performance.md; docs/qa/lighthouse/*

**Kriteria selesai:**

- [ ] Versi browser/Lighthouse, mesin, throttling, dataset, dan waktu pengukuran dicatat.
- [ ] Tiga pengukuran setelah warm-up per halaman menghasilkan median; target minimal 85 per halaman.
- [ ] Hasil mentah dan hambatan utama disimpan tanpa mengubah kondisi uji agar skor terlihat lulus.

**Verifikasi:** Jalankan Lighthouse mobile untuk /, daftar artikel, satu detail artikel, dan /kegiatan pada production server lokal.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-20 — setelah T057

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T058

- [ ] **Perbaiki hanya hambatan performa terukur**

**Hasil:** Jika ada halaman gagal target, optimalkan penyebab yang terbukti; jika sudah lulus, catat tidak ada perubahan yang diperlukan.

**Dependensi:** T057  
**Acuan PRD:** §13 Performance  
**Ukuran:** M  
**File yang mungkin disentuh:** komponen/gambar/query yang terukur; docs/qa/performance.md; tests regresi terkait

**Kriteria selesai:**

- [ ] Perbaikan berdasarkan profil hasil T057; tidak mengurangi konten, aksesibilitas, atau kontrol akses.
- [ ] Median seluruh halaman mencapai minimal 85 dengan kondisi/dataset yang sama setelah perubahan.
- [ ] Jika >5 file dibutuhkan, buat subtugas; setiap perubahan runtime diuji regresi relevan.

**Verifikasi:** Ulangi benchmark hanya untuk halaman terdampak lalu konfirmasi target empat halaman; uji media/cache dan fungsionalitas yang disentuh.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-21 — setelah T058

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

## Fase F — Dokumentasi dan demo localhost

Setup dapat diulang, panduan serah terima tersedia, dan MVP dinilai terhadap PRD.

### T059

- [ ] **Tulis panduan setup dan buktikan clean start**

**Hasil:** Dokumentasikan environment, runtime, port, database, migration, bootstrap Admin, seed, dev/build/start, serta perintah uji yang benar-benar ada.

**Dependensi:** T049, T053, T058  
**Acuan PRD:** §11.3; AC-22  
**Ukuran:** M  
**File yang mungkin disentuh:** README.md; docs/setup.md; .env.example; docs/qa/clean-start.md

**Kriteria selesai:**

- [ ] Pengembang dapat mengikuti setup dari folder/data kosong pada lingkungan uji tanpa secret bawaan.
- [ ] Port dapat dikonfigurasi; proses lain tidak dihentikan otomatis; data bertahan setelah restart.
- [ ] Perintah dokumentasi diverifikasi persis, termasuk cara membuat akun Media dan reset password lokal oleh Admin.

**Verifikasi:** Ikuti README pada lingkungan uji bersih; jalankan build/production start dan satu alur publish; catat prasyarat aktual.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T060

- [ ] **Tulis prosedur backup dan restore**

**Hasil:** Sediakan panduan backup database+media yang konsisten dan prosedur pemulihan ke target terpisah.

**Dependensi:** T049, T059  
**Acuan PRD:** §13 Reliability; §16  
**Ukuran:** S  
**File yang mungkin disentuh:** docs/operations/backup-restore.md; docs/qa/recovery-status.md

**Kriteria selesai:**

- [ ] Panduan menjelaskan urutan konsistensi database/file, lokasi backup, dan pemeriksaan izin setelah restore.
- [ ] Tidak ada reset/restore destruktif ke database kerja/produksi tanpa target eksplisit.
- [ ] Kebutuhan retensi, frekuensi, target pemulihan, dan bukti restore wajib sebelum produksi ditandai belum diputuskan jika memang belum ada.

**Verifikasi:** Periksa langkah di lingkungan demo; restore percobaan hanya ke database/storage terpisah bila lingkungan tersedia. Jika belum diuji, catat jujur dan jangan klaim siap produksi.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-22 — setelah T060

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

### T061

- [ ] **Tulis panduan CMS dan naskah demo**

**Hasil:** Buat panduan singkat bagi dua role dan pengurus berikutnya, beserta urutan demo alur normal dan penolakan akses.

**Dependensi:** T022, T032, T038, T049, T059  
**Acuan PRD:** §15 Phase 5; §16  
**Ukuran:** M  
**File yang mungkin disentuh:** docs/cms-guide.md; docs/demo-script.md; docs/handover.md

**Kriteria selesai:**

- [ ] Panduan mencakup draft/review/revisi/publish/withdraw, media, periode, kampanye, serta assignment.
- [ ] Ada langkah serah terima akun, penonaktifan, dan penggantian kontak tanpa membagikan password di dokumen.
- [ ] Demo membedakan contoh dengan informasi resmi dan tidak mengklaim pekerjaan produksi selesai.

**Verifikasi:** Jalankan naskah menggunakan Admin, dua Media, serta browser anonim; cocokkan screenshot/langkah dengan aplikasi terkini.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T062

- [ ] **Audit kelulusan MVP terhadap PRD**

**Hasil:** Susun bukti final untuk sebelas modul, seluruh skenario penerimaan, dan Definition of Done tanpa menyamakan checklist dengan hasil uji.

**Dependensi:** T051, T052, T054, T055, T056, T058, T059, T060, T061  
**Acuan PRD:** §14–16; AC-01; AC-02; AC-03; AC-04; AC-05; AC-06; AC-07; AC-08; AC-09; AC-10; AC-11; AC-12; AC-13; AC-14; AC-15; AC-16; AC-17; AC-18; AC-19; AC-20; AC-21; AC-22; AC-23; AC-24; AC-25; AC-26; AC-27; AC-28; AC-29  
**Ukuran:** M  
**File yang mungkin disentuh:** docs/qa/mvp-acceptance.md; docs/qa/test-results/*

**Kriteria selesai:**

- [ ] Setiap FR-01–FR-11 dan AC-01–AC-29 mempunyai bukti hasil aktual, bukan hanya tautan tugas.
- [ ] Lint/typecheck/build dan suite relevan lulus; hambatan/penyimpangan memiliki status nyata dan tidak ditutup diam-diam.
- [ ] Hasil performa menggunakan seed final; perubahan data/kode sesudah benchmark memicu pengecekan ulang yang terdampak.

**Verifikasi:** Jalankan pemeriksaan final terintegrasi dan telusuri matriks PRD→tugas→tes/bukti; kegagalan berarti belum selesai.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

### T063

- [ ] **Serahkan demo localhost yang dapat diulang**

**Hasil:** Jalankan demo lengkap dari panduan dan serahkan daftar prasyarat produksi yang masih terbuka.

**Dependensi:** T062  
**Acuan PRD:** §15 Phase 5; §16; §18.2  
**Ukuran:** S  
**File yang mungkin disentuh:** docs/demo-script.md; docs/handover.md; docs/qa/mvp-acceptance.md

**Kriteria selesai:**

- [ ] Website dan /admin dapat dibuka melalui URL lokal aktual; dua role menjalankan alur lengkap dengan data contoh.
- [ ] Ringkasan hasil, keterbatasan, keputusan yang disetujui, serta pekerjaan produksi berikutnya tersedia.
- [ ] Tidak ada deployment, domain, publikasi internet, atau secret produksi yang dibuat sebagai bagian tugas ini.

**Verifikasi:** Ikuti naskah demo T061 dan cocokkan hasil dengan audit T062; catat penerimaan pemilik proyek saat benar-benar diberikan.

**Bukti/status:** Belum dikerjakan; isi hasil tes, URL demo lokal, atau tautan laporan ketika tersedia.

#### CP-23 — setelah T063

- [ ] Verifikasi tugas sejak checkpoint sebelumnya lulus; simpan bukti dan catat hambatan.
- [ ] Untuk perubahan aplikasi: pemeriksaan statis/build dan regresi terarah yang relevan lulus; jalur yang sudah bekerja tetap dapat digunakan.
- [ ] Periksa lingkup, dependensi, dan keputusan yang masih terbuka; jangan tandai tugas lanjutan selesai berdasarkan rencana saja.

## Penutupan backlog

- [ ] T001–T063 beserta subtugas tambahan selesai dan bukti dapat ditelusuri.
- [ ] Seluruh FR/AC dalam [plan.md](plan.md) ditautkan ke bukti aktual pada T062.
- [ ] Pemilik proyek meninjau hasil demo; penerimaan dicatat ketika benar-benar diberikan.
- [ ] Kebutuhan produksi tetap memiliki status terpisah; tidak ada deployment otomatis dari checklist ini.

