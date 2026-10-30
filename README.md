# GIBEI UISI

Website localhost dengan Next.js App Router, TypeScript dan Payload. Halaman publik masih penanda pengembangan; login CMS serta kontrol akun/sesi dan audit sudah diverifikasi sampai T007. Kebutuhan produk: [PRD](docs/PRD-v1.1.md). Status: [backlog](tasks/todo.md).

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

`start` menjalankan hasil build produksi, bukan dev server. Hentikan server sebelumnya atau gunakan `pnpm start --port 3200`. `typecheck` menghasilkan tipe route terlebih dahulu sehingga dapat dijalankan sebelum build. Skrip pengujian unit/integration/e2e ditambahkan pada T008.

## Struktur dan environment

- `src/app/(public)/`: root layout publik, CSS dan halaman awal; terpisah dari layout Payload di `(payload)`.
- `docs/technical/`: stack dan kontrak editorial/media.
- `.env.example`: placeholder konfigurasi server; aplikasi/CMS memerlukan `.env.local`, secret dan koneksi database.

Ikuti [panduan setup](docs/setup.md) untuk database, migration Payload dan bootstrap Admin. CMS: `http://127.0.0.1:3000/admin`; gunakan kredensial BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD pada `.env.local`. Jangan membagikan nilainya di chat atau Git. `pnpm bootstrap:admin` tidak menimpa akun yang sudah ada; `pnpm test:cms` memeriksa login/logout pada server berjalan. Admin mengelola akun/reset lokal lewat Users; perubahan role/status/email/password memerlukan login ulang target. Audit tersedia di Account Audit. [Laporan T007](docs/reports/T007.md) memuat bukti dan batasnya. T008 siap dikerjakan.

Jalankan `pnpm db:check`, `pnpm db:verify`, `pnpm test:db-config` dan `pnpm test:auth-policy` untuk pemeriksaan terkait. Jangan menaruh kredensial di `NEXT_PUBLIC_*`; PAYLOAD_SECRET hanya di environment server. File upload, runtime portable, dependency dan output build diabaikan Git. Temuan audit yang tersisa dan batas verifikasi tercatat pada [laporan T006](docs/reports/T006.md).

CSS awal sengaja sederhana; Tailwind dan fondasi visual dibangun pada T009. Robot metadata disetel noindex/nofollow untuk pratinjau. Situs belum diterbitkan ke internet.
