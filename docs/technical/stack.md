# Verifikasi stack — T002

Tanggal pemeriksaan: **23 Oktober 2026**. Acuan: PRD v1.1 §11.1 dan [T002](../../tasks/todo.md#t002).

**Hasil awal T002:** verifikasi dokumentasi selesai pada 23 Oktober 2026. **Pembaruan 26 Oktober 2026:** T004 membuktikan Node LTS, kerangka dan tooling; T005 membuktikan koneksi PostgreSQL Supabase, role/schema, TLS client, migration serta transaksi/persistensi. Lihat [T004](../reports/T004.md) dan [T005](../reports/T005.md). TypeScript memakai 5.9.3 sesuai parser. Tabel kondisi mesin di bawah mempertahankan pengamatan awal; adapter Payload/CMS belum diuji.

## Keputusan terbaru: Supabase

**Pembaruan T006 — 30 Oktober 2026:** Payload/Next/Postgres adapter 3.92.0 telah diintegrasikan dan migration pada schema payload serta login/logout CMS telah diuji. GraphQL tetap nonaktif. DOMPurify dipatok ke 3.4.17 untuk memperbaiki advisory sanitizer; runner tsx 4.23.15 ditambahkan. Lihat [laporan T006](../reports/T006.md) untuk bukti dan temuan audit tersisa. Tabel/uraian T002–T005 di bawah merupakan dasar keputusan dan pengamatan pada tanggal masing-masing.

**Pembaruan T008 — 30 Oktober 2026:** Node test runner dan Playwright Test 1.64.1 menyediakan unit/integration/e2e. Database uji PostgreSQL 17.11 lokal terpisah memakai role runtime/migrator dan fixture Admin/dua Media. Backend native portable telah diuji; Docker engine belum aktif sehingga jalur container belum diverifikasi runtime. Database pengembangan tetap Supabase dengan TLS/CA yang sama. Lihat [laporan T008](../reports/T008.md).

**Pembaruan T009:** Tailwind/plugin 4.3.3, PostCSS 8.5.28 dan Fontsource Manrope variable 5.3.0 kini terpasang. Versi PostCSS runtime ini memenuhi rentang plugin serta patch advisory; tabel T002 di bawah tetap mencatat kandidat dokumentasi 8.5.31. Font Latin dilayani lokal melalui next/font/local; styling hanya di layout publik. Axe Playwright 4.14.0 dipakai untuk audit terarah. Fondasi publik, CP-03 dan hasil 13 e2e tercatat pada [laporan T009](../reports/T009.md).

**Pembaruan T010:** editor `@payloadcms/richtext-lexical` 3.92.0 dipasang dengan fitur teks dasar; dependency happy-dom dipatok melalui override 21.0.4 untuk dua advisory high. Node 24.22.1 memenuhi engine; build/editor dan 15 e2e lulus. Snapshot/migrasi Payload menambah koleksi artikel, revisi internal, kategori dan audit di private schema. [Laporan T010](../reports/T010.md) mencatat audit dependency terbaru dan batas workflow.

Pada 23 Oktober 2026 pemilik proyek memilih [proyek Supabase lgqnxvldjqzgbfyxqonx](https://supabase.com/dashboard/project/lgqnxvldjqzgbfyxqonx). Keputusan ini menggantikan database Docker lokal. T005 memverifikasi PostgreSQL aktual **17.11** melalui `SELECT version()` pada 26 Oktober 2026. Aplikasi/CMS tetap localhost dan membutuhkan internet untuk database hosted. Payload tetap memakai adapter PostgreSQL dan autentikasi CMS; Supabase Auth/Storage tidak ditambahkan.

Ambil connection string dari menu **Connect** dashboard: direct connection jika jaringan mendukung, atau session pooler 5432 untuk jaringan IPv4. Salin host aktual, jangan menebaknya. Transaction pooler 6543 belum dipilih. Simpan `DATABASE_URL` hanya pada environment server yang diabaikan Git; API key bukan pengganti kredensial PostgreSQL. [Panduan koneksi](https://supabase.com/docs/guides/database/connecting-to-postgres).

T003 merancang schema Payload yang tidak diekspos melalui Data API beserta role/grants; verifikasi pengaturan aktual. Tabel yang diekspos memerlukan grants dan RLS sesuai model akses. T005 membuktikan TLS, koneksi, migrasi dan transaksi; T008 menyiapkan target uji terisolasi. Jangan reset proyek bersama atau tabel layanan Supabase. [Keamanan Data API](https://supabase.com/docs/guides/api/securing-your-api).

Pada T002 belum tersedia akses Supabase terautentikasi dan tidak ada perubahan remote. Pada T005, integrasi Supabase dan koneksi Node lokal berhasil; fondasi privat diterapkan dan dites. Dokumentasi/[changelog](https://supabase.com/changelog) diperiksa ulang 26 Oktober 2026. Schema aplikasi tidak diekspos Data API. Docker tetap opsional. Rincian dua temuan advisor bawaan dan batas TLS internal pooler ada pada laporan T005.

## Matriks versi yang dipilih

Baris awal diperiksa pada 23 Oktober 2026; perubahan bertanggal T004 diperiksa pada 26 Oktober 2026. Pin ini menjadi masukan T004–T006; versi aktual T004 tersimpan pada package.json dan lockfile. Jika pin berubah, catat alasan serta ulangi pemeriksaan peer dependency.

| Komponen | Versi target | Dasar pemilihan dan sumber resmi |
|---|---|---|
| Node.js | **24.22.1 LTS** | Memenuhi engine Payload `^22.23.4 || >=24.22.1`; tersedia rilis LTS dan binary Windows. [Rilis Node](https://nodejs.org/en/blog/release/v24.22.1), [persyaratan Payload](https://payloadcms.com/docs/getting-started/installation) |
| pnpm | **10.24.0** | Versi lokal dipertahankan; metadata engine `>=18.12` menerima Node target. Bukan klaim versi terbaru. [Metadata versi](https://registry.npmjs.org/pnpm/10.24.0), [instalasi pnpm](https://pnpm.io/installation) |
| Next.js App Router | **16.4.2** | Memenuhi peer `@payloadcms/next` 3.92.0 untuk jalur 16: `>=16.3.3 <17.0.0`; engine Next `>=20.9.0`. [Metadata Next](https://registry.npmjs.org/next/16.4.2), [metadata integrasi](https://registry.npmjs.org/@payloadcms%2Fnext/3.92.0), [panduan Next](https://nextjs.org/docs/app/getting-started/installation) |
| React dan React DOM | **19.3.1**, keduanya | React DOM memerlukan React `^19.3.1`; Next menerima `^19.0.0`; editor/UI Payload menerima `^19.0.1 || ^19.1.2 || ^19.2.1`. Caret tersebut juga mencakup 19.3.1. [React](https://registry.npmjs.org/react/19.3.1), [React DOM](https://registry.npmjs.org/react-dom/19.3.1), [UI Payload](https://registry.npmjs.org/@payloadcms%2Fui/3.92.0) |
| TypeScript | **5.9.3** (penyesuaian T004, 26 Oktober 2026) | Pin awal 7.0.2 memenuhi engine Node tetapi di luar rentang parser `typescript-eslint@8.72.0` (`>=4.8.4 <6.1.0`). Versi 5.9.3 memenuhi rentang parser dan Node target. [TypeScript](https://registry.npmjs.org/typescript/5.9.3), [parser/tooling](https://registry.npmjs.org/typescript-eslint/8.72.0) |
| Payload | **3.92.0** | Engine Node di atas dan peer GraphQL `^16.8.1`. [Metadata](https://registry.npmjs.org/payload/3.92.0) |
| `@payloadcms/next` | **3.92.0** | Peer Payload harus tepat 3.92.0; rentang Next diperiksa dari paket versi ini. [Metadata](https://registry.npmjs.org/@payloadcms%2Fnext/3.92.0) |
| `@payloadcms/db-postgres` | **3.92.0** | Peer Payload tepat 3.92.0; adapter memakai Drizzle dan node-postgres. [Metadata](https://registry.npmjs.org/@payloadcms%2Fdb-postgres/3.92.0), [panduan adapter](https://payloadcms.com/docs/database/postgres) |
| `@payloadcms/richtext-lexical` | **3.92.0** | Peer Payload dan integrasi Next tepat 3.92.0; React target memenuhi rentangnya. [Metadata](https://registry.npmjs.org/@payloadcms%2Frichtext-lexical/3.92.0) |
| Tailwind CSS dan `@tailwindcss/postcss` | **4.3.3**, keduanya | Plugin mengunci Tailwind 4.3.3 dan memerlukan PostCSS `^8.5.16`. [Tailwind](https://registry.npmjs.org/tailwindcss/4.3.3), [plugin](https://registry.npmjs.org/@tailwindcss%2Fpostcss/4.3.3), [integrasi Next](https://tailwindcss.com/docs/installation/framework-guides/nextjs) |
| PostCSS | **8.5.31** | Memenuhi kebutuhan plugin Tailwind; engine menerima Node target. [Metadata](https://registry.npmjs.org/postcss/8.5.31) |
| GraphQL, dependency integrasi | **16.14.2** | Memenuhi peer Payload `^16.8.1`. Tag latest saat diperiksa menunjuk 17.0.2 yang tidak cocok, sehingga jangan memakai latest. Memasang dependency ini tidak mengharuskan endpoint GraphQL publik diaktifkan. [Metadata versi](https://registry.npmjs.org/graphql/16.14.2), [peer Payload](https://registry.npmjs.org/payload/3.92.0) |
| Sharp, untuk turunan gambar | **0.35.5** | Engine `>=20.9.0`; diperlukan untuk manipulasi gambar yang direncanakan. Binary Windows dan proses transformasi belum diuji. [Metadata](https://registry.npmjs.org/sharp/0.35.5), [panduan Payload](https://payloadcms.com/docs/getting-started/installation) |
| PostgreSQL | **Supabase PostgreSQL 17.11** | Versi aktual dan fondasi database dibuktikan pada T005; integrasi adapter tetap T006. Driver verifikasi pg 8.23.1 dan CLI Supabase 2.122.0 dipatok pada lockfile. [Laporan T005](../reports/T005.md), [adapter Payload](https://payloadcms.com/docs/database/postgres) |

Paket internal `@payloadcms/ui`, `@payloadcms/graphql`, dan `@payloadcms/translations` yang ditarik integrasi Next harus mengikuti 3.92.0. Metadata editor juga mencantumkan peer `@faceless-ui/modal` **3.0.0** dan `@faceless-ui/scroll-info` **2.0.0**; metadata kedua peer menerima React 19. Jangan mengabaikan peringatan peer saat T004/T006. [Modal](https://registry.npmjs.org/@faceless-ui%2Fmodal/3.0.0), [scroll-info](https://registry.npmjs.org/@faceless-ui%2Fscroll-info/2.0.0).

## Hasil pemeriksaan kompatibilitas

- **Engine Node:** target 24.22.1 memenuhi Payload, Next, pnpm, TypeScript, Sharp, dan paket pendukung yang diperiksa.
- **Peer CMS:** semua paket Payload yang dipilih berada pada 3.92.0; pasangan Next/React/React DOM/GraphQL memenuhi rentang yang dideklarasikan.
- **CSS:** Tailwind dan plugin PostCSS berada pada versi sama; PostCSS 8.5.31 memenuhi kebutuhan plugin.
- **Perbedaan sumber:** panduan instalasi Payload menuliskan Next 16.2.6+, tetapi metadata `@payloadcms/next@3.92.0` meminta minimal 16.3.3 pada jalur 16. Gunakan persyaratan paket yang lebih ketat. Next 16.4.2 memenuhi keduanya.
- **Belum terbukti:** resolusi seluruh dependency transitif pada pnpm, kompilasi TypeScript, runtime React/editor, binary Sharp, migrasi dan transaksi PostgreSQL. Semuanya memerlukan instalasi atau aplikasi yang belum termasuk T002.

## Kondisi mesin lokal

Pemeriksaan memakai `Get-Command`, perintah versi, serta pengecekan lokasi instalasi umum; tidak mengubah runtime global.

| Komponen | Hasil aktual | Tindak lanjut |
|---|---|---|
| Node | `v25.1.0`, `C:\Program Files\nodejs\node.exe` | Versi ini secara numerik memenuhi engine Payload, tetapi berbeda dari target LTS proyek. Siapkan Node 24.22.1 sebelum instalasi/build T004. |
| npm | `11.6.3` melalui `npm.cmd` | Tersedia; package manager proyek tetap pnpm. |
| pnpm | `10.24.0` melalui `pnpm.cmd` | Sesuai target; cek ulang setelah mengganti Node. |
| Git | `2.49.0.windows.1` | Tersedia; belum ada repository `.git` pada pemeriksaan workspace. Inisialisasi lokal termasuk T004. |
| Corepack | Tidak ditemukan pada PATH | Bukan prasyarat karena pnpm sudah tersedia. |
| Docker | Pemeriksaan awal tidak menemukan instalasi; user kemudian melaporkan sudah terpasang dan sedang diperbarui | Engine/Compose belum diperiksa ulang; opsional untuk database Supabase hosted. |
| PostgreSQL/psql | `psql` tidak ditemukan pada PATH; `C:\Program Files\PostgreSQL` tidak ditemukan | Tidak membuktikan ketiadaan server di lokasi lain. Koneksi database belum diuji. |

## Batas integrasi untuk tugas berikutnya

1. **T003:** rancang kontrak versi, publikasi, audit, transaksi, media privat, dan cache di atas stack ini. Kemampuan workflow PRD tidak dianggap otomatis terpenuhi oleh fitur draft/version CMS.
2. **T004:** gunakan Node target, pin versi paket, simpan lockfile, dan jalankan lint/typecheck/build setelah kerangka tersedia. Tentukan versi tooling pengujian pada tugas terkait. Pisahkan route group publik dan Payload; impor CSS Tailwind pada layout publik agar tidak mengganggu panel CMS.
3. **T005:** hubungkan server lokal ke PostgreSQL Supabase melalui environment server; periksa versi, TLS, mode koneksi, role/schema dan target pengembangan. Docker/database lokal bukan prasyarat.
4. **T005–T006:** buktikan adapter 3.92.0 dengan versi server aktual, migrasi yang dapat diulang, persistensi setelah restart aplikasi/reconnect, serta transaksi. Tentukan schema push dan migrasi secara eksplisit tanpa mengubah tabel layanan Supabase.
5. **T011–T025:** buktikan akses file asli/turunan, revisi terbit, audit atomik, konflik, dan invalidasi cache terhadap kontrak T003. Jangan menyimpulkan bahwa lolos build membuktikan aturan akses tersebut.

## Bukti dan batas penyelesaian

Metadata diambil langsung melalui HTTPS dari endpoint registry yang ditautkan di matriks, dengan membaca `version`, `engines`, `peerDependencies`, serta dependency integrasi Next/Tailwind. Versi GraphQL dipilih dari daftar rilis stabil 16.x. Pemeriksaan tidak menjalankan installer atau kode dependency.

Kedua kriteria T002 terpenuhi. T003 selesai melalui [kontrak editorial](editorial-architecture.md) dan [akses media](media-access.md). **T001–T025 / Fase B selesai**, CP-01–CP-09 ditinjau; 23 unit, 36 integration dan 22 e2e membuktikan API/CMS/halaman artikel. Sharp 0.35.5 dan pdf-lib 1.17.1 teruji; `@payloadcms/ui` 3.92.0 kini dependency langsung untuk hooks UI, tanpa perubahan versi CMS. Migrasi terbaru tetap 20261031_070403_safe_deletion dan seluruhnya applied; T021–T025 tidak memerlukan schema baru. Berhenti sebelum T026. Lihat [laporan T025](../reports/T025.md). Matriks/kondisi mesin T002 di atas merupakan snapshot historis; status runtime terbaru mengikuti laporan implementasi.
