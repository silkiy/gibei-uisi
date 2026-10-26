# GIBEI UISI

Kerangka website localhost dengan Next.js App Router dan TypeScript. Halaman awal adalah penanda pengembangan. Fondasi PostgreSQL Supabase sudah diverifikasi; integrasi Payload/CMS mengikuti T006. Kebutuhan produk: [PRD](docs/PRD-v1.1.md). Status: [backlog](tasks/todo.md).

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

- `src/app/(public)/`: root layout publik, CSS dan halaman awal; route group memisahkan layout ini dari Payload yang akan ditambahkan.
- `docs/technical/`: stack dan kontrak editorial/media.
- `.env.example`: placeholder server untuk tahap database/CMS. Kerangka saat ini berjalan tanpa secret atau koneksi database.

Ikuti [panduan database](docs/setup.md) untuk `.env.local`, koneksi Session pooler, CA TLS, role runtime/migrasi dan bootstrap target baru. Jalankan `pnpm db:check`, `pnpm db:verify` serta `pnpm test:db-config` untuk verifikasi. Jangan menaruh kredensial di `NEXT_PUBLIC_*` atau commit `.env.local`. T006 menambahkan Payload; PAYLOAD_SECRET tetap hanya di environment server. File upload, runtime portable, dependency dan output build diabaikan Git.

CSS awal sengaja sederhana; Tailwind dan fondasi visual dibangun pada T009. Robot metadata disetel noindex/nofollow untuk pratinjau. Situs belum diterbitkan ke internet.
