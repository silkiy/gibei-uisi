# T059 — Clean start

Proof bersih memakai **direktori source baru dan database/media baru**, tanpa menyalin `.env.local`, `.env.test.local`, node_modules, output build atau media utama. `scripts/export-demo-source.mjs` mengekspor snapshot working source saat ini, mencatat commit asal/hash/jumlah file pada `artifacts/clean-start-source.json`, lalu memastikan environment privat dan dependency belum ada pada target.

Urutan yang dijalankan dari source hasil ekspor:

1. Node 24.22.1 dan pnpm 10.24.0 tersedia pada PATH.
2. `pnpm install --frozen-lockfile --store-dir PATH_STORE_PROYEK` memakai lockfile, bukan pembaruan paket. Untuk checkout biasa, gunakan `.pnpm-store` lokal seperti README; store bersama hanya mempercepat proof tanpa menggandakan unduhan.
3. Set `GIBEI_TEST_PG_BIN` ke lokasi binary PostgreSQL 17.11 native yang telah disiapkan, atau gunakan Docker Linux sesuai panduan. Binary tidak disertakan dalam source/Git dan tidak didownload otomatis oleh proof.
4. `pnpm demo --benchmark`: membuat akun/secret/database/port milik run, migration, bootstrap Admin, production build/start dan seed semua modul. Tidak memuat `.env.local`; launcher Payload juga mendukung target uji eksplisit tanpa berkas tersebut.
5. Jalankan `node scripts/demo-check.mjs PATH_KE_DEMO_ENV` untuk seluruh modul, dua Media/Admin/pengunjung serta draft→review→revisi→publish→revisi privat→withdraw. Periksa cookie dan audit tanpa mencetak kredensial.
6. Data/byte setelah restart dan restore terpisah juga dibuktikan pada suite final. Ctrl+C membersihkan hanya target milik launcher; tidak ada kill proses lain atau reset Supabase.

**Hasil: lulus setelah perbaikan startup CMS.** Source baru `.tools/clean-start-da2ee2b4d554`, 366 file, parent commit `9e615bf` dan working tree snapshot. SHA-256 source `f1eed0c0428ab8a2a1c3ca52d2a6e48b1abf3759cf688e0160efa075cd473b49`, tanpa patch source sesudah ekspor. Finalisasi dokumen sesudah proof tidak mengubah kode aplikasi. Frozen install dari node_modules kosong selesai dalam 58.1 detik dengan lockfile; migration/bootstrap/seed dan build production lulus tanpa `.env.local`. Peringatan Next tentang lockfile induk timbul karena direktori ekspor berada di dalam checkout; build/start tetap berhasil. Startup membuka SSR CMS sebelum API; run `ed5a6d611a71` membuka website `http://127.0.0.1:59497` dan `/admin`. Naskah empat aktor lulus (`artifacts/demo-handover.json`); secret acak hanya pada berkas privat run. Tidak ada instrumen diagnosis dalam source baru. Prasyarat aktual: Git, Node/pnpm, storage/port lokal yang dapat ditulis, PostgreSQL native atau Docker, Chromium Playwright untuk browser proof, serta akses registry saat dependency belum di-cache. Untuk aplikasi utama berbasis Supabase, internet dan environment server privat tetap diperlukan.

Setup bersih ini membuktikan build/demo tanpa secret bawaan. Untuk konten persisten utama, ikuti [setup](../setup.md), bootstrap satu Admin melalui secret environment lokal, buat akun Media melalui Users, lalu gunakan review. Reset password lokal dilakukan Admin melalui field Password dan Save; sesi lama dicabut. Jangan memakai akun/password demo sebagai akun produksi.
