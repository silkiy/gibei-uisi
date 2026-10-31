# Pengujian lokal

Gunakan Node 24.22.1, pnpm 10.24.0 dan dependency dari lockfile. `@playwright/test` dipatok 1.64.1, dengan browser Chromium milik proyek; profil browser pribadi tidak digunakan.

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec playwright install chromium
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

`test:unit` memakai runner bawaan Node dan tidak membuka database. `test:integration` menjalankan tes HTTP/database. `test:e2e` menjalankan Playwright. `test:all` menjalankan unit, integration dan e2e; dua lapisan terakhir berbagi satu database/server sementara agar tidak perlu build dua kali.

## Pilihan database uji

Secara default runner memakai engine Linux Docker yang sudah Running dan image resmi PostgreSQL 17.11 bookworm yang dipatok berdasarkan digest registry. Container dibuat dengan nama/label unik, database ephemeral dan port acak yang hanya terikat ke 127.0.0.1; tidak memakai volume host atau service database pengembangan.

Jika Docker tidak tersedia, siapkan binary PostgreSQL yang dipercaya, lalu salin `.env.test.example` menjadi `.env.test.local` dan isi `GIBEI_TEST_PG_BIN` dengan direktori yang berisi postgres, initdb dan pg_ctl. Pada mesin pengembangan ini binary portable tersedia di:

```dotenv
GIBEI_TEST_PG_BIN=.tools/postgresql-17.11-server/pgsql/bin
```

Binary berasal dari [distribusi Windows yang dirujuk PostgreSQL](https://www.postgresql.org/download/windows/) dan [halaman binary resmi EDB](https://www.enterprisedb.com/download-postgresql-binaries). File 17.11-5 didapat lewat file ID 1260616 melalui HTTPS. SHA256 arsip yang diunduh: `80379b2c04d51c30225532e0ae04509899141e9957ed096fe749d7fd9df8f82f`. Hash ini adalah catatan artefak lokal, bukan checksum vendor yang diverifikasi terpisah; postgres.exe dalam arsip tidak bertanda tangan Authenticode. Tidak ada perubahan execution policy atau instalasi service Windows. Binary/data lokal diabaikan Git.

Backend native membuat cluster baru di `.tools/test-databases/<run-id>`, memakai SCRAM dan password acak, lalu membatasi listen ke loopback pada port acak. Folder data dihapus hanya setelah lokasi aktual dan marker run cocok, serta pg_ctl mengonfirmasi server berhenti. Backend Docker memeriksa label dan ID container sebelum menghapusnya. Kegagalan tes tetap menjalankan cleanup; interupsi paksa proses/mesin dapat memerlukan cleanup manual dari artefak run yang bersangkutan. Jangan menggunakan prune atau penghapusan menyeluruh untuk itu.

## Kontrak fixture dan reset

- Launcher tidak memuat `.env.local`. Seluruh URL database, secret Payload, password Admin/Media dan port server dibuat untuk run itu. Ia hanya membaca pilihan backend dari `.env.test.local`; jangan taruh kredensial Supabase di sana.
- Database harus bernama `gibei_test_<12 hex>`, pada 127.0.0.1, dengan role gibei_runtime/gibei_migrator. Koneksi test menolak hostname Supabase, database `postgres`, role operator dan run ID yang berbeda. TLS Supabase tetap memakai CA/rejectUnauthorized; hanya koneksi loopback test yang memakai SSL=false.
- Reset membutuhkan nama database, role migrator dan record `test_meta.run` yang cocok. Reset men-truncate tabel aplikasi dalam schema payload memakai transaksi satu client; tabel migration dipertahankan. Tidak ada reset melalui URL database pengembangan.
- Migration Payload asli diterapkan, Admin dibuat lewat bootstrap yang terlindungi, dua Media dibuat lewat API Admin. Runtime test memakai role terbatas yang sama dengan aplikasi; role postgres hanya untuk menyiapkan cluster/database test milik run tersebut.
- `tests/support/http.mjs` menyediakan request anonim, login dan request terautentikasi. `tests/e2e/fixtures.ts` menyediakan accounts, adminPage, mediaAPage dan mediaBPage dengan browser context terpisah. Kredensial fixture hanya diteruskan ke child process, tidak ditulis ke Git atau storageState.
- Server test menggunakan hasil build produksi pada `.next-test`, port loopback acak, dan tsconfig.test.json. Tidak memakai server yang sudah berjalan. Server utama 3000 dan `.next` dapat tetap aktif. Jalankan harness satu per satu karena output test build yang sama dipakai.

Tambahkan tes fungsi murni di `tests/unit/*.test.mjs`. Tambahkan pengujian API pada `tests/integration/` dan masukkan berkasnya ke daftar runner saat menambah suite. Tambahkan flow browser pada `tests/e2e/*.spec.ts`; Playwright menemukannya secara otomatis. Jangan menambah retry otomatis untuk menutupi kegagalan izin/race.

T009 menambah `public-shell.spec.ts`: lima ukuran layar, target anchor, keyboard/Escape/fokus, reduced motion, reflow/ukuran teks 200% serta dua scan axe untuk aturan WCAG A/AA terarah. Audit otomatis melengkapi pengujian keyboard dan inspeksi visual; tidak membuktikan seluruh kriteria WCAG telah terpenuhi.

T010 menambah `articles.test.mjs` dan `articles.spec.ts`: visibilitas dua Media, assignment/transfer, field terlindungi, slug duplikat, rollback create/save dengan kegagalan audit, dua save bersamaan, serta create/edit/reload rich text pada CMS. `verify-editorial-local.ts` menguji default Local API override dan context palsu pada target test yang dijaga. Integration files dijalankan berurutan karena fault injection sementara mencabut INSERT audit milik runtime. Grant dipulihkan dalam finally sebelum tes berikutnya.

## Hasil batch T011–T020

Per 31 Oktober 2026: 20 unit, 30 integration, 18 Chromium e2e dan Local API guard lulus. Suite menambah upload/validasi PDF worker, gateway/HEAD/range/optimizer, submit/revisi/publish/rollback, reader publik, working revision, withdraw/dependency, reuse dan revoke/delete. `media-reuse.test.mjs` membuktikan pencabutan referensi terakhir; `deletion.test.mjs` menguji seluruh referensi, fallback, tombstone, audit gagal dan filesystem cleanup retry. Fixture junction hanya dibuat pada direktori run yang diverifikasi dan dipulihkan dalam finally. Tidak ada fault injection pada database/file Supabase pengembangan.

Build/TypeScript/lint dan instalasi `pnpm install --frozen-lockfile --offline --ignore-scripts --store-dir .pnpm-store` lulus pada mesin ini. Gunakan store yang sesuai instalasi lokal; jangan mengizinkan penggantian seluruh node_modules hanya untuk mengatasi store berbeda. [Laporan T020](reports/T020.md) memuat bukti dan batasnya. T021 menambah pembuktian race keputusan; T022–T025 melengkapi UI/halaman serta alur artikel end-to-end.

Request API Playwright di luar browser harus menyertakan Origin dari baseURL test agar cookie diterima oleh pemeriksaan CSRF Payload. Fixture login menunggu URL/dashboard selesai sebelum navigasi berikutnya. Jangan menonaktifkan CSRF, mengabaikan tes, atau menaikkan timeout untuk meloloskan masalah akses.

## Bukti dan diagnosis

Ringkasan lulus/gagal muncul di terminal. Log migration/build/test ada di `artifacts/test-run.log`, screenshot yang dibuat eksplisit di `test-results/`; semuanya diabaikan Git. Trace/video/storageState dimatikan agar kredensial/cookie tidak tersimpan dalam rekaman jaringan. Hindari membagikan log mentah sebelum memeriksa isinya. Kegagalan proses menghasilkan exit nonzero; tidak ada tes yang dilewati karena database/browser belum tersedia.

Sumber workflow: [Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html), [Playwright fixtures](https://playwright.dev/docs/test-fixtures), [isolasi browser](https://playwright.dev/docs/browser-contexts), [initdb](https://www.postgresql.org/docs/17/app-initdb.html), [pg_ctl](https://www.postgresql.org/docs/17/app-pg-ctl.html), serta guide Playwright/distDir Next 16.4.2 yang terpasang.
