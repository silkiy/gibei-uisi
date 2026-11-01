# Setup localhost dan PostgreSQL Supabase

Terakhir diverifikasi: **31 Oktober 2026**, sampai T025/akhir Fase B. Runtime Node 24.22.1, pnpm 10.24.0; langkah aplikasi ada di [README](../README.md). API, CMS dan halaman artikel publik telah diuji bersama. [Laporan T025](reports/T025.md) mencatat bukti dan batas implementasi. T026 siap dan belum dimulai.

## Environment server

Gunakan `.env.local` yang diabaikan Git. `.env.example` hanya template. Jangan menyalin secret ke kode, log, `next.config` bagian env, atau variabel `NEXT_PUBLIC_*`.

| Variabel | Isi |
|---|---|
| DATABASE_URL | Connection string role runtime PostgreSQL, bukan URL API HTTPS Supabase. |
| MIGRATION_DATABASE_URL | Connection string role gibei_migrator; hanya untuk tooling migration. |
| DATABASE_CA_FILE | `certs/supabase-prod-ca-2021.crt`, path CA publik yang disimpan di repo. |
| PAYLOAD_SECRET | Secret lokal minimal 32 karakter yang tidak berupa placeholder; digunakan T006. Bukan anon/publishable/service-role API key. |

Pilih **Connect → Session pooler** pada [proyek Supabase](https://supabase.com/dashboard/project/lgqnxvldjqzgbfyxqonx), port 5432. Host harus disalin dari dashboard, tidak ditebak dari region. Username pooler mengikuti `ROLE.PROJECT_REF`; URL meng-encode karakter khusus password. Direct connection juga didukung jika jaringan memiliki IPv6/IPv4 add-on yang sesuai. Transaction pooler 6543 tidak dipakai baseline ini. [Panduan koneksi](https://supabase.com/docs/guides/database/connecting-to-postgres).

Client memakai CA eksplisit dan `rejectUnauthorized: true`; parameter SSL pada URL dihapus agar tidak menimpa pengaturan tersebut. Koneksi gagal jika sertifikat tidak dapat diverifikasi. Jangan memakai `NODE_TLS_REJECT_UNAUTHORIZED=0`. [Perilaku SSL node-postgres](https://node-postgres.com/features/ssl).

CA publik diambil dari URL yang digunakan [konfigurasi resmi Supabase Studio](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json): `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`. CA berlaku hingga 26 April 2031. Perubahan CA harus diverifikasi dari sumber resmi, bukan diganti otomatis saat koneksi gagal.

## Memeriksa lingkungan yang sudah disiapkan

Aktifkan Node portable jika belum memakai Node target:

```powershell
$env:Path = "$PWD\.tools\node-v24.22.1;$env:Path"
pnpm install --frozen-lockfile
pnpm test:db-config
pnpm db:check
pnpm db:verify
```

`db:check` hanya membaca versi, role, dan status TLS; tidak mencetak connection string/password. Pool maksimal 3 koneksi, connection timeout 12 detik, idle timeout 10 detik, statement timeout 15 detik.

`db:verify` menulis UUID dummy pada tabel khusus `gibei_meta.connection_probe`, memeriksa commit/rollback dan membaca hasil commit dari proses Node baru. Ia juga membuktikan role runtime tidak dapat membuat tabel atau membaca `auth.users`; role migrasi dapat menjalankan DDL yang kemudian di-rollback. Cleanup hanya menghapus UUID milik run tersebut. Tidak ada reset schema/database atau pembacaan data Auth. Tidak boleh diarahkan ke proyek lain; konfigurasi mengunci project ref dan port.

## Fondasi schema dan peran

- `payload`: schema aplikasi privat, awalnya kosong untuk tabel yang akan dibuat Payload.
- `gibei_meta`: schema privat untuk probe infrastruktur, tanpa konten editorial.
- `gibei_migrator`: owner kedua schema, dapat membuat/mengubah tabel aplikasi; bukan superuser, tidak memiliki CREATEDB/CREATEROLE/BYPASSRLS.
- `gibei_runtime`: hanya USAGE schema dan operasi data yang diberi grant; tidak memiliki CREATE schema, kepemilikan tabel atau hak administratif.

Schema tidak diberi USAGE kepada PUBLIC/anon/authenticated/service_role dan tidak tersedia melalui Data API. Probe memakai RLS dengan policy khusus gibei_runtime. Default privileges pada schema payload berlaku untuk tabel yang dibuat **gibei_migrator**; migrasi aplikasi wajib memakai role tersebut. Owner migration mengelola policy/privilege baru; RLS konten tidak otomatis memakai `auth.uid()` karena akun CMS dikelola Payload.

Infrastruktur memakai migration `supabase/migrations/20261026101710_database_foundation.sql`, dicatat di history Supabase. CLI menghasilkan berkas awal; nama diselaraskan dengan version history yang benar-benar diterapkan lewat integrasi. Migrasi ini membutuhkan role administrator pada target kosong karena membuat role dan schema. Jangan menjalankannya ulang pada target yang sudah berisi fondasi. Jangan memakai perintah reset atau db push massal ke proyek ini.

Tabel/collection aplikasi akan dikelola melalui **migration Payload pada T006+**, terpisah dari bootstrap infrastruktur Supabase ini. Saat mengintegrasikan adapter: schemaName=payload, push=false, disableCreateDatabase=true, TLS/connection limit sesuai konfigurasi ini, dan transaksi tetap aktif. Fitur schemaName masih perlu dibuktikan pada adapter Payload; T005 baru membuktikan PostgreSQL/role/schema, belum adapter.

## Bootstrap pada target pengembangan baru

1. Pastikan proyek pengembangan kosong dan diizinkan; periksa schema, tabel dan role sebelum menerapkan migration infrastruktur. Jangan membuat branch/proyek berbayar tanpa persetujuan biaya.
2. Terapkan SQL infrastruktur melalui mekanisme migration Supabase yang ditinjau. Jangan memasukkan password ke file SQL atau history migration.
3. Untuk bootstrap pertama saja, isi DATABASE_URL dengan koneksi admin postgres dari Connect, serta DATABASE_CA_FILE. Jalankan `pnpm db:provision` setelah fondasi tersedia.
4. Tool membuat password acak 32 byte untuk masing-masing role, mengaktifkan LOGIN dan mengganti DATABASE_URL dengan role runtime serta menambah MIGRATION_DATABASE_URL di `.env.local`. Secret tidak dicetak dan URL admin tidak dipertahankan di file baru. Nilai PAYLOAD_SECRET yang sudah ada dipertahankan; jika belum disiapkan, buat secret acak dengan `node:crypto` tanpa mencetaknya ke log bersama.
5. Jalankan pemeriksaan di atas. `db:provision` menolak role yang sudah diaktifkan dan tidak merotasi password secara diam-diam. Jika pemasangan file gagal setelah commit role, pertahankan `.env.local.pending` untuk dipasang sebagai `.env.local`; jangan membuangnya atau mengulang setup. Pemulihan role dapat dilakukan Admin melalui prosedur terpisah.

Data uji T005 diisolasi secara logis pada schema/tabel privat dalam proyek yang sama, bukan pada branch/instance berbayar terpisah. T008 masih harus menyediakan target fixture penuh yang terisolasi sebelum reset/test editorial. Schema layanan Supabase (`auth`, `storage`, dan lainnya) tidak diubah.

## Batas verifikasi TLS dan advisor

Client localhost → Session pooler terbukti terenkripsi dengan certificate authorized. `pg_stat_ssl` pada backend melaporkan **false** untuk leg internal pooler → PostgreSQL; ini berbeda dari TLS client. Pengaturan SSL enforcement seluruh proyek belum diubah karena dapat memicu reboot database. Jangan mengklaim TLS end-to-end atau readiness produksi dari hasil ini. [SSL enforcement Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement).

Dua warning advisor pada fungsi `public.rls_auto_enable()` sudah ada sebelum T005 dan tetap ada sesudahnya. Fungsi mengembalikan event_trigger; akses EXECUTE yang dilaporkan perlu ditinjau pada audit keamanan T053, tanpa menyimpulkan RPC dapat dieksploitasi atau mengubah fungsi bawaan secara sembarang. [Temuan anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [temuan authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Payload dan Admin localhost — T006

Gunakan `http://127.0.0.1:3000/admin`. SERVER_URL harus sama dengan origin browser; default 127.0.0.1:3000. Jika mengganti hostname/port, isi SERVER_URL di `.env.local` dan restart server. Origin asing ditolak pada mutasi. HTTP hanya untuk loopback; non-local CMS membutuhkan HTTPS dan cookie Secure.

```powershell
pnpm payload generate:types
pnpm payload generate:importmap
pnpm payload migrate:status
pnpm bootstrap:admin
pnpm test:auth-policy
pnpm test:cms
```

Untuk target baru sesudah fondasi T005 tersedia, jalankan `pnpm payload migrate` sebelum bootstrap. Command migration memakai role gibei_migrator; web server dan bootstrap memakai gibei_runtime. Migration Payload berada di `src/migrations` dan dicatat di payload.payload_migrations, terpisah dari bootstrap Supabase di `supabase/migrations`. Jangan menerapkan SQL migration Payload sekali lagi melalui Supabase CLI/MCP, atau memakai reset/down/fresh pada target ini. Wrapper hanya menyediakan command yang ditinjau serta satu skrip bootstrap lokal.

Admin demo pertama telah dibuat. Kredensial ada pada BOOTSTRAP_ADMIN_EMAIL dan BOOTSTRAP_ADMIN_PASSWORD dalam `.env.local`; password acak tidak dicetak ke terminal/chat. Pada checkout baru, siapkan credential lokal dengan password acak minimal 16 karakter, tanpa mengubah akun yang sudah ada. `bootstrap:admin` menggunakan lock PostgreSQL dan hanya create jika belum ada akun; rerun tidak mereset password/role. Jika environment credential tidak lagi sesuai akun, jangan memaksa bootstrap; pemulihan dilakukan melalui prosedur Admin T007.

Runner resmi Payload dipakai untuk bootstrap agar koneksi heartbeat adapter selesai bersama proses CLI. Kegagalan melempar error tersanitasi dan menghasilkan exit nonzero. Jalankan melalui script package, bukan memanggil file TypeScript bootstrap langsung dengan Node.

Config memakai schemaName=payload, push=false, transaksi aktif, dan disableCreateDatabase=true. Aplikasi memakai CA publik pada path statis `certs/supabase-prod-ca-2021.crt` agar build hanya menelusuri berkas tersebut; tooling pemeriksaan database tetap mendukung DATABASE_CA_FILE. Jangan mengganti CA untuk menghindari error verifikasi.

Pendaftaran first-user web dan endpoint email recovery sengaja ditutup. Email adapter tidak mengirim maupun mencetak reset token. Login memakai cookie HttpOnly/SameSite Lax, sesi database 7200 detik dan maksimal lima login salah sebelum lock 15 menit. Token tidak dikembalikan lewat JSON. T007 membuka pengelolaan akun sesuai prosedur berikut. GraphQL tidak diaktifkan; temuan dependency yang tersisa dijelaskan pada [laporan T006](reports/T006.md).

## Akun, reset lokal dan pengujian — T007

Masuk sebagai Admin aktif → Users → Create New untuk menambahkan akun. Pada akun yang ada, ubah role/status/nama/email sesuai kebutuhan. Untuk reset lokal, gunakan Change Password di form akun, isi password baru 16–256 karakter beserta konfirmasi, lalu simpan. Password diserahkan melalui saluran pribadi. Tidak ada pengiriman email pemulihan. Akun terkunci login perlu menunggu lock 15 menit berakhir; manual unlock bawaan ditutup.

Perubahan role/status/email/password mencabut semua sesi target; login ulang diperlukan. Jika mereset password Admin bootstrap, perbarui BOOTSTRAP_ADMIN_PASSWORD lokal untuk menjalankan `test:cms`; bootstrap tidak menyinkronkan atau menimpa password yang sudah ada. Jangan menonaktifkan/menurunkan Admin aktif terakhir: server menolak dengan 409. Akun tidak dihapus permanen pada MVP; gunakan status inactive. Media tidak dapat mengubah akun/password sendiri. Riwayat tersedia untuk Admin di Account Audit dan tidak dapat diedit/dihapus.

`pnpm test:accounts` adalah suite T007 terarah pada schema sementara, port 3200. Hentikan dev server proyek sebelum menjalankannya karena menggunakan direktori build dev yang sama. Jangan hentikan proses milik aplikasi lain.

Operator database menyediakan **schema baru kosong** berformat `payload_test_t007_<12 hex>` dengan owner gibei_migrator, melalui koneksi operator/integrasi Supabase. Contoh SQL berikut hanya template; ganti suffix dengan 12 digit hex baru, lalu gunakan nama persis yang dibuat. Jangan memakai schema yang telah berisi data.

```sql
CREATE SCHEMA payload_test_t007_012345abcdef AUTHORIZATION gibei_migrator;
REVOKE ALL ON SCHEMA payload_test_t007_012345abcdef FROM PUBLIC, anon, authenticated;
```

```powershell
$env:T007_TEST_SCHEMA = 'payload_test_t007_012345abcdef'
pnpm test:accounts
Remove-Item Env:T007_TEST_SCHEMA
pnpm dev
```

Suite memeriksa nama, ownership dan tabel kosong, menjalankan fixture terisolasi dan menghapus schema tersebut pada cleanup. Buat schema baru lagi untuk menjalankan ulang; gibei_migrator sengaja tidak diberi CREATE pada database. Jangan simpan CMS_TEST_SCHEMA di `.env.local`; runner meneruskannya hanya ke child test dan config menolak override ini pada mode produksi. Wrapper CLI mengizinkan `verify-account-local.ts` hanya pada schema uji tersebut.

## Harness umum — T008

Bagian berikut mencatat harness yang mulai tersedia pada T008 dan masih dipakai sampai T020.

Untuk pengujian berikutnya gunakan `pnpm test:unit`, `pnpm test:integration`, dan `pnpm test:e2e`. [Panduan pengujian](testing.md) menjelaskan fixture Admin/dua Media, pilihan backend, guard reset, log dan isolasi browser. Harness baru menggunakan database lokal yang terpisah sepenuhnya dari Supabase, bukan schema sementara T007. Backend native portable telah disiapkan pada `.env.test.local`; file ini hanya memilih direktori binary dan tidak berisi kredensial pengembangan.

## Backend artikel dan media — T011–T020

Jalankan `pnpm payload migrate` menggunakan MIGRATION_DATABASE_URL sebelum menjalankan kode baru. Schema push tetap nonaktif. Urutan migration ada pada `src/migrations/index.ts`; migration terbaru perbaikan QA adalah `20261101_091210_page_revision_archival`, sesudah `20261101_040307_recruitment_campaigns`. Enam belas migrasi sudah diterapkan ke Supabase pengembangan. Backup database dan `storage/private` perlu diperlakukan sebagai satu pasangan sebelum pemindahan lingkungan; latihan restore menyeluruh tetap T059.

Pages T026 tersedia di `/admin/collections/pages`. Admin membuat identitas `homepage` atau `about` (masing-masing satu) dan menentukan owner/assignee. Media yang ditugaskan menyimpan blok hero/profil/program/CTA dan SEO lalu mengajukan review; Admin memberi catatan revisi atau menerbitkan melalui panel editorial. Preview privat berada di `/editorial/pages/[id]`. Teks textarea mendukung paragraf LF/CRLF; URL CTA hanya rute yang didukung atau HTTPS. About terbit dibaca di `/tentang`; homepage agregasi tetap T042.

Site Settings tersedia di `/admin/globals/site-settings`, hanya Admin. Isi nama/logo/favicon, kontak/sosial terkonfirmasi, navigasi dan footer lalu Save; simpan langsung berlaku dan diaudit. Field kontak kosong/belum dikonfirmasi tidak menjadi kanal resmi. Header/footer memakai konfigurasi yang sama. Isi profil homepage/About tetap pada Pages.

Periode berada di `/admin/collections/organizational-periods`, divisi di `/admin/collections/divisions`. Admin membuat identitas dan menentukan owner/assignee; Media mengedit lalu mengajukan review melalui panel editorial, Admin memutuskan. Tanggal periode memakai `YYYY-MM-DD` tanpa konversi WIB/UTC. Delapan slug divisi telah dibatasi sesuai PRD; label data contoh aktif secara default sampai materi resmi disetujui. Hasil terbit muncul di `/tentang/divisi` dan detail slug-nya. Profil/periode belum diisi pada Supabase; fixture delapan profil hanya ada saat pengujian. Pengurus tersedia di `/admin/collections/members`, hasil approved di `/tentang/struktur` beserta pilihan arsip. Pilih periode terbit pada `/admin/globals/organization-state` (Periode aktif); perubahan operasional diaudit terpisah dari isi.

Riset tersedia di `/admin/collections/research-publications`; empat kategori awal di `/admin/collections/research-categories` dikelola Admin. Media membuat draft, melengkapi tanggal analisis YYYY-MM-DD, tim publik, referensi serta PDF opsional dan mengajukan review. Disclaimer dasar tetap; catatan tambahan terpisah. Hasil terbit muncul di `/publikasi/riset` dan detail slug.

Event tersedia di `/admin/collections/events`. Field waktu jelas berlabel WIB; ISO tanpa offset diartikan +07:00 dan disimpan UTC. End harus sesudah start. Admin mengonfirmasi URL pendaftaran HTTPS; perubahan URL Media menghapus konfirmasi lama. Status/CTA memakai waktu server, pembatalan melalui review. API snapshot berada di `/api/public/events/[slug]`; daftar/detail dan arsip kegiatan tersedia di `/kegiatan`. Konten pengurus/riset/event resmi belum diisi.

Upload melalui formulir pada daftar Media menyimpan gambar/PDF ke `storage/private`, di luar public/static. Setiap upload membuat key dan versi baru. Reader file adalah `/api/media/:key/original` atau `/thumbnail`; URL lama tetap memakai pengecekan izin saat request. Jangan menyalin file tersebut ke public/CDN atau memakai optimizer.

UI antrean dan aksi editorial tersedia pada Articles sejak T022. Semua POST memakai cookie login, header Origin yang sama dengan SERVER_URL dan JSON terbatas; jangan meletakkan cookie/token pada command atau dokumen yang dibagikan.

| Endpoint | Kontrak |
|---|---|
| POST `/api/editorial/articles/:id/:action` | `expectedLockVersion`, `expectedRevisionId`, serta `submissionId` untuk keputusan pengajuan. Actions: submit, withdraw-submission, request-revision, publish, create-revision, archive-revision, restart-archived, withdraw-publication, delete-draft. |
| Request-revision / withdraw-publication / delete-draft | Hanya Admin dan alasan `note` wajib. Publish/archive/restart juga hanya Admin. Expected revision memakai pointer publik untuk create-revision/withdraw-publication, ID arsip untuk restart, pointer kerja untuk lainnya. |
| POST `/api/media/:key/manage` | Admin, `{action:"revoke"|"delete",note:"alasan"}`. Delete yang masih dirujuk mengembalikan 409 dan `references`; revoke menampilkan dampak dan mematikan byte segera. |
| GET `/api/public/articles` dan `/:slug` | Tanpa login, hanya snapshot approved saat ini, tanpa data draft/owner/reviewer. Query list: q, category, page, limit. |

Jika delete mengembalikan `cleanupPending:true`, file sudah ditutup aksesnya tetapi pembersihan disk gagal. Periksa warning dengan assetId dan ulangi aksi delete setelah kendala storage selesai; jangan menghapus path yang belum diverifikasi. Draft dihapus secara logis sehingga audit/riwayat tetap tersedia untuk Admin. Ledger konfigurasi hanya melindungi retensi; Site Settings dan izin publik konfigurasinya tetap T027.

Verifikasi akhir berlangsung pada produksi lokal `http://127.0.0.1:3200` dengan SERVER_URL khusus proses, sementara dev server pengguna 3000 dipertahankan. Gunakan origin yang sama saat menjalankan `pnpm test:cms` pada port alternatif.

## Menggunakan alur artikel melalui CMS

1. Media membuat artikel melalui Articles, mengisi judul/ringkasan/body/penulis publik dan menyimpan. Admin menetapkan kategori. Pada dropdown kategori yang memiliki banyak pilihan, ketik namanya untuk mencari.
2. Simpan perubahan sebelum memakai panel **Alur editorial**. **Preview privat** memerlukan login/izin dan menampilkan versi tersimpan. Klik **Ajukan review** untuk mengunci snapshot.
3. Admin membuka **Antrean review** pada daftar Articles, meninjau preview, lalu mengisi alasan untuk **Minta revisi** atau memilih **Terbitkan**. Media melihat catatan, memperbaiki, menyimpan dan mengajukan ulang.
4. Artikel terbit muncul pada `/publikasi/artikel` dan detailnya. Untuk mengeditnya, gunakan **Buat revisi baru** terlebih dahulu; versi publik tetap tampil selama draft/review berikutnya.
5. **Tarik publikasi** memerlukan alasan Admin. Pengajuan pending dibatalkan dan revisi kerjanya tetap tersimpan. Jika terjadi konflik, baca pesan, muat ulang dan tinjau kembali versi/referensi sebelum mencoba ulang.

Untuk gambar/PDF, upload dahulu melalui Media, pilih pada Assets revisi dan simpan. Link editor mendukung HTTPS atau link internal ke Media yang sama dengan manifest Assets. File yang tidak diposisikan inline tampil sebagai lampiran. Alt/caption yang disetujui mengikuti snapshot, bukan perubahan metadata library. PDF dilayani sebagai attachment; optimizer gambar tetap nonaktif.

Daftar artikel mengikuti PRD: default 12/maksimum 48, pencarian case-insensitive, kategori tak dikenal kosong, pagination numerik tidak valid memakai default dan halaman valid di luar rentang menampilkan empty state. Parameter API di luar allowlist tetap 400. Label pratinjau selalu terlihat; artikel fixture pengujian tidak dimasukkan ke Supabase pengembangan.


## Rekrutmen dan homepage P0 — T037–T042

CMS rekrutmen berada di `/admin/collections/recruitment-periods`: pilih periode terbit, isi posisi/persyaratan dan divisi opsional, tahapan, jadwal WIB serta URL HTTPS. Media mengajukan review; hanya Admin mengonfirmasi tujuan pendaftaran. Publikasi isi tidak mengaktifkan kampanye.

Pada `/admin/globals/recruitment-state` (Aktivasi rekrutmen), pilih kampanye terbit lalu Save. Untuk pindah, kosongkan/nonaktifkan pilihan lama lalu Save dahulu, kemudian pilih target baru. Maksimum satu enabled juga berlaku untuk kampanye mendatang/selesai. Penarikan menonaktifkan otomatis; berakhirnya waktu menutup CTA tanpa mengubah pilihan Admin. `/rekrutmen?kampanye=slug` menyediakan riwayat terbit.

`/kontak` dan footer memakai kontak terkonfirmasi yang sama. `/publikasi` menampilkan tiga artikel dan tiga riset terbaru. Homepage mengambil hero/blok Pages homepage, profil About, publikasi dan agenda mendatang dari snapshot approved. Panel rekrutmen memakai konfigurasi operasional dan waktu server. Galeri/prestasi/mitra dan tugas setelah T042 tetap mengikuti backlog. Tidak ada konten resmi yang diisi otomatis.


## Arsip dan restart setelah QA CP-15

Pada panel editorial Pages dan reviewed content, Admin dapat mengisi alasan lalu memilih **Arsipkan revisi** untuk draft/revision_required setelah review tertunda dibatalkan. Hanya working revision yang diarsipkan; publikasi tetap tampil. **Mulai ulang dari arsip** hanya tersedia bagi Admin saat tidak ada publikasi/revisi kerja. Media tetap dapat memilih **Buat revisi baru** dari konten terbit yang berizin. Semua operasi ini memakai versi, transaksi dan audit; jalankan migration terbaru dahulu. CTA Pages yang menuju `/rekrutmen` memakai pemeriksaan API/deadline yang sama dengan panel rekrutmen.
