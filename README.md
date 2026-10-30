# GIBEI UISI

Website localhost dengan Next.js App Router, TypeScript dan Payload. Fondasi visual publik, CMS dan harness uji terisolasi sudah diverifikasi sampai T009. Konten publik masih pratinjau berlabel. Kebutuhan produk: [PRD](docs/PRD-v1.1.md). Status: [backlog](tasks/todo.md).

## Menjalankan

Gunakan Node **24.22.1** dan pnpm **10.24.0**, sesuai `.node-version` dan `packageManager`. Jika memakai binary portable yang disiapkan pada mesin pengembangan ini, aktifkan untuk sesi PowerShell:

```powershell
$env:Path = "$PWD\.tools\node-v24.22.1;$env:Path"
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Folder `.tools` tidak masuk Git. Pada checkout baru, pasang Node versi tersebut melalui pengelola runtime pilihan Anda terlebih dahulu. Unduhan portable berasal dari [rilis resmi Node](https://nodejs.org/en/blog/release/v24.22.1); verifikasi terhadap SHASUMS256 sebelum menjalankan binary yang diunduh.

Buka `http://127.0.0.1:3000`. Jika port terpakai, gunakan `pnpm dev --port 3200` tanpa menghentikan proses lain.

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

`start` menjalankan hasil build produksi, bukan dev server. Hentikan server sebelumnya atau gunakan `pnpm start --port 3200`. `typecheck` menghasilkan tipe route terlebih dahulu sehingga dapat dijalankan sebelum build.

Pengujian: `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, atau `pnpm test:all`. Fixture mencakup Admin dan dua Media pada database lokal baru yang dihapus setelah tes. Lihat [panduan pengujian](docs/testing.md) untuk Docker/PostgreSQL portable dan pemasangan Chromium. Harness memakai port acak dan `.next-test`, sehingga server utama dapat tetap berjalan.

## Struktur dan environment

- `src/app/(public)/`: root layout publik, CSS dan halaman awal; terpisah dari layout Payload di `(payload)`.
- `docs/technical/`: stack dan kontrak editorial/media.
- `.env.example`: placeholder konfigurasi server; aplikasi/CMS memerlukan `.env.local`, secret dan koneksi database.

Ikuti [panduan setup](docs/setup.md) untuk database, migration Payload dan bootstrap Admin. CMS: `http://127.0.0.1:3000/admin`; gunakan kredensial BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD pada `.env.local`. Jangan membagikan nilainya di chat atau Git. `pnpm bootstrap:admin` tidak menimpa akun yang sudah ada; `pnpm test:cms` memeriksa login/logout pada server berjalan. Admin mengelola akun/reset lokal lewat Users; perubahan role/status/email/password memerlukan login ulang target. Audit tersedia di Account Audit. [Laporan T009](docs/reports/T009.md) memuat verifikasi publik dan CP-03. T010 siap dikerjakan.

Jalankan `pnpm db:check`, `pnpm db:verify`, `pnpm test:db-config` dan `pnpm test:auth-policy` untuk pemeriksaan terkait. Jangan menaruh kredensial di `NEXT_PUBLIC_*`; PAYLOAD_SECRET hanya di environment server. File upload, runtime portable, dependency dan output build diabaikan Git. Temuan audit yang tersisa dan batas verifikasi tercatat pada [laporan T006](docs/reports/T006.md).

Fondasi publik memakai Tailwind 4.3.3, font Manrope lokal dan token sementara; lihat [panduan desain](docs/design.md). Menu mobile, keyboard dan reduced motion telah diuji. Logo/foto/kontak resmi serta konten CMS final tetap menunggu tugas berikutnya. Robot metadata disetel noindex/nofollow untuk pratinjau. Situs belum diterbitkan ke internet.
