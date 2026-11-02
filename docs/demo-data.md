# Data demo T049

Seluruh data contoh adalah simulasi, bukan identitas pengurus, kerja sama, prestasi, kontak atau jadwal resmi. Tidak ada kredensial tetap di kode. Gambar bidang warna dan PDF edukasi dibuat sendiri oleh script; tidak mengambil foto orang atau logo pihak ketiga.

## Menjalankan demo terisolasi

Gunakan Node/pnpm pada [setup](setup.md), serta Docker Linux yang aktif atau `GIBEI_TEST_PG_BIN` pada `.env.test.local` sesuai [testing](testing.md).

```powershell
pnpm demo
# Dataset benchmark tetap: 24 artikel
pnpm demo --benchmark
```

Launcher membuat PostgreSQL dan media terpisah, menerapkan migrasi, membangun aplikasi production, membuat akun dengan password acak, lalu menjalankan seed melalui API dan workflow review yang sama dengan CMS. URL menggunakan port loopback bebas; lihat keluaran terminal. Admin dan Media tersedia pada berkas `demo.env` di direktori `.tools/test-databases/<run-id>/` yang ditampilkan launcher. Buka berkas itu secara lokal; jangan kirim isinya ke chat atau Git.

Untuk mengulangi seed pada demo yang masih berjalan, gunakan terminal lain:

```powershell
node --env-file=.tools/test-databases/<run-id>/demo.env scripts/seed-demo.mjs
node --env-file=.tools/test-databases/<run-id>/demo.env scripts/seed-demo.mjs --benchmark
```

`<run-id>` diganti dengan direktori aktual. Script memverifikasi host loopback, nama database, role migrator dan marker kepemilikan sebelum login atau menulis. `.env.local` tidak dimuat oleh seed/launcher. Target Supabase dan target tanpa marker ditolak. Kredensial dapat diberikan melalui environment `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_MEDIA_EMAIL`, `DEMO_MEDIA_PASSWORD`; tidak ada nilai password contoh yang dapat dipakai masuk.

Ctrl+C mengakhiri demo dan membersihkan **hanya target sementara milik launcher**. Data di Supabase/aplikasi utama tidak direset. Demo baru menghasilkan target baru; ini merupakan reset eksplisit untuk data simulasi. Seed tidak menyediakan opsi penghapusan/penimpaan konten pada database utama. Jangan menjalankan demo bersamaan dengan harness pengujian karena keduanya menggunakan `.next-test`.

## Isi dataset

| Modul | Default | Benchmark |
|---|---:|---:|
| Periode | 2 | 2 |
| Divisi PRD | 8 | 8 |
| Pengurus fiktif | 4 | 4 |
| Artikel | 3 | 24 |
| Riset + disclaimer tetap | 2 | 2 |
| Kegiatan (arsip dan mendatang) | 3 | 3 |
| Rekrutmen (arsip dan mendatang, tidak enabled) | 2 | 2 |
| Album | 2 | 2 |
| Mitra fiktif | 2 | 2 |
| Prestasi fiktif pada dua tahun | 2 | 2 |
| Homepage/About | 2 | 2 |
| Media orisinal | 1 PNG + 1 PDF | sama |

Slug, tanggal kalender dan isi tetap; ID, password, port, waktu audit dan file key ditentukan saat run. Benchmark menambah artikel sampai 24, tidak mengurangi data. Sampel mitra memakai `example.com`, tanpa catatan izin logo: logo disembunyikan meskipun gambar yang sama publik pada album. Tidak ada kontak resmi palsu, URL pendaftaran aktif atau seed hosted otomatis.

Seed mencari identitas tetap dan melewati item yang sudah ada, termasuk draft, revisi pengguna dan konten yang ditarik. Ia tidak menerbitkan ulang, mereset password, mengaktifkan rekrutmen atau mengganti pilihan periode yang sudah ditetapkan. Jika seed terhenti setelah membuat sebuah draft, ulangannya mempertahankan draft tersebut untuk diperiksa Admin. Sebuah slug milik pengguna tidak dianggap boleh ditimpa hanya karena menyerupai slug demo.

Tes `zz-seed.test.mjs` menjalankan benchmark tiga kali, membuat edit pengguna di antaranya dan memeriksa file tetap dapat diakses. Harness juga membandingkan pointer publik, audit dan hash file sebelum/sesudah restart aplikasi/PostgreSQL lokal.
