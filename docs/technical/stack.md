# Verifikasi stack — T002

Tanggal pemeriksaan: **23 Oktober 2026**. Acuan: PRD v1.1 §11.1 dan [T002](../../tasks/todo.md#t002).

**Hasil awal T002:** verifikasi dokumentasi dan ketersediaan runtime lokal selesai pada 23 Oktober 2026. **Pembaruan T004, 26 Oktober 2026:** runtime Node 24.22.1 portable telah diverifikasi, dependency dan lockfile tersedia, lint/typecheck/build serta browser kerangka lulus. TypeScript disesuaikan ke 5.9.3 untuk kompatibilitas parser. [Laporan T004](../reports/T004.md) menjadi bukti runtime terbaru; tabel kondisi mesin di bawah mempertahankan pengamatan awal. Koneksi database/CMS belum diuji.

## Keputusan terbaru: Supabase

Pada 23 Oktober 2026 pemilik proyek memilih [proyek Supabase lgqnxvldjqzgbfyxqonx](https://supabase.com/dashboard/project/lgqnxvldjqzgbfyxqonx). Keputusan ini menggantikan database Docker lokal dan pin PostgreSQL 17.11 pada pemeriksaan awal. Versi PostgreSQL aktual belum diverifikasi; T005 mencatat hasil `SELECT version()`. Aplikasi/CMS tetap localhost dan membutuhkan internet untuk database hosted. Payload tetap memakai adapter PostgreSQL dan autentikasi CMS; Supabase Auth/Storage tidak ditambahkan.

Ambil connection string dari menu **Connect** dashboard: direct connection jika jaringan mendukung, atau session pooler 5432 untuk jaringan IPv4. Salin host aktual, jangan menebaknya. Transaction pooler 6543 belum dipilih. Simpan `DATABASE_URL` hanya pada environment server yang diabaikan Git; API key bukan pengganti kredensial PostgreSQL. [Panduan koneksi](https://supabase.com/docs/guides/database/connecting-to-postgres).

T003 merancang schema Payload yang tidak diekspos melalui Data API beserta role/grants; verifikasi pengaturan aktual. Tabel yang diekspos memerlukan grants dan RLS sesuai model akses. T005 membuktikan TLS, koneksi, migrasi dan transaksi; T008 menyiapkan target uji terisolasi. Jangan reset proyek bersama atau tabel layanan Supabase. [Keamanan Data API](https://supabase.com/docs/guides/api/securing-your-api).

Dokumentasi dan [changelog](https://supabase.com/changelog) diperiksa pada 23 Oktober 2026, termasuk perubahan default eksposur Data API. Dashboard privat tidak dapat diperiksa melalui alat web dan tidak ada tool Supabase terautentikasi yang tersedia saat ini. Tidak ada query atau perubahan remote dilakukan. User melaporkan Docker sudah terpasang dan sedang diperbarui; Engine/Compose belum diperiksa ulang dan opsional untuk Supabase hosted. T002 tetap selesai secara dokumentasi; T003 kemudian diselesaikan pada tanggal yang sama dan T005 belum dikerjakan.

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
| PostgreSQL | **Supabase; versi aktual belum diverifikasi** | Menggantikan pin lokal 17.11 sesuai pilihan pemilik proyek. Versi server dan kompatibilitas adapter diperiksa pada T005. [Koneksi Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [adapter Payload](https://payloadcms.com/docs/database/postgres) |

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

Kedua kriteria T002 terpenuhi. T003 selesai melalui [kontrak editorial](editorial-architecture.md) dan [akses media](media-access.md). **Pembaruan 26 Oktober 2026: T004 selesai**, dengan bukti runtime pada [laporan](../reports/T004.md); T005 siap dikerjakan untuk database Supabase.
