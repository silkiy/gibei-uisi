# Perbaikan QA CP-01–CP-15

**Status: QA-01, QA-02 dan QA-03 ditutup pada 1 November 2026.** Delapan tugas terkait serta CP-10–CP-15 dipulihkan setelah regresi, empat probe reproduksi dan verifikasi akhir lulus. Cakupan tetap T001–T042, tanpa memulai T043. [Audit awal](CP01-CP15.md) dipertahankan sebagai riwayat.

## Arsip dan restart — QA-01/QA-02

Pages dan shared reviewed engine mempertahankan endpoint `create-revision` untuk kompatibilitas, dengan dua pemeriksaan sumber: revisi dari publikasi aktif tetap tersedia untuk editor berizin; sumber archived tanpa public pointer hanya boleh dimulai ulang oleh Admin. UI membedakan “Buat revisi baru” dan “Mulai ulang dari arsip”. Request Media yang ditolak tidak mengubah lockVersion, pointer atau riwayat.

Tindakan Admin `archive-revision` memerlukan draft/revision_required, tidak ada pending review, dan alasan yang valid. Working pointer dilepas; public pointer tetap sama dan audit mencatat revisi yang diarsipkan. Catatan/histori serta referensi file tidak dihapus. Pages menambahkan nilai `revision_archived` melalui migrasi `20261101_091210_page_revision_archival`; down menolak membuang enum jika riwayat tersebut sudah dipakai.

**Bukti:** 64 integration lulus. `tests/integration/pages.test.mjs` mencakup draft yang perlu revisi, pending review, pemisahan publik/working dan restart Admin. `tests/integration/z-archival.test.mjs` menguji langsung keenam jenis shared reviewed: periode, divisi, pengurus, riset, event dan rekrutmen; juga penolakan Media, audit serta fault/rollback saat INSERT audit ditolak. Posisi file z-archival diperlukan karena Node mengurutkan file tes secara alfabetis dan fixture delapan divisi dibuat pada tes organisasi sebelumnya.

Migrasi tambahan sudah diterapkan ke Supabase pengembangan. Pemeriksaan langsung: 16 migrasi, satu akun, nol artikel/pengurus/riset/event/kampanye; audit Pages tidak mendapat UPDATE/DELETE bagi runtime dan anon tidak mendapat USAGE schema privat. Tidak ada seed konten resmi atau migration down yang dijalankan.

## CTA Pages — QA-03

Blok CTA dengan rute `/rekrutmen` menggunakan LiveRegistration, termasuk pada homepage, profil About di homepage, dan halaman Tentang. Label CMS serta rute internal dipertahankan, tetapi anchor hanya tampil setelah API memvalidasi kampanye/waktu/konfirmasi tujuan. Filter satu kali pada render homepage dihapus agar kampanye enabled yang belum dibuka tetap dapat membuka CTA pada jadwalnya.

Setiap instance link memiliki ref/penjaga klik sendiri; beberapa CTA dengan endpoint sama tidak saling meminjam listener. Deadline konservatif, revalidasi visibility/pageshow dan penolakan saat API gagal berlaku bagi tombol utama maupun link dari Pages. CTA informasi lain tetap memakai renderer sebelumnya. Pemilihan kampanye operasional membaca pointer aktif secara langsung, bukan bergantung pada apakah kampanye masuk 200 item pilihan arsip.

Regresi browser memperluas `zz-p0-home.spec.ts`: kedua sumber CTA diuji sebelum/sesudah deadline tanpa reload, penonaktifan, pergantian kampanye, kegagalan API serta pemulihan tab. `zz-qa-workflow.spec.ts` menguji tombol arsip/restart kedua layanan melalui CMS. Seluruh browser dan pengulangan probe audit lulus.

## Verifikasi akhir

- `pnpm test:all`: **32 unit, 64 integration, 33 e2e lulus**, tanpa retry. Local API boundary, audit setelah restart dan guarded cleanup tetap lulus. Log lokal `artifacts/qa-cp01-cp15-fixed-full.log`.
- Empat probe audit awal: **4 lulus**, dibandingkan tiga gagal/satu lulus sebelum perbaikan. Restart Media pada Pages/Events kini **403/403**, pengarsipan Admin **200/200**, API setelah tutup `canRegister:false` dan jumlah link CTA Pages **0**. Kontrol akun, reset/sesi, rollback audit dan race Admin terakhir tetap lulus. Assertion bisnis tidak dilonggarkan; setup probe hanya memulai ulang fixture homepage lewat Admin setelah operasi arsip yang kini berhasil. Log `artifacts/qa-cp01-cp15-fixed-probes.log`.
- Screenshot `artifacts/QA-CP15-fixed-cta.png` diinspeksi: keterangan ditutup tetap terbaca dan link ajakan mendaftar telah hilang. Screenshot bukti kegagalan sebelumnya dipertahankan secara terpisah.
- Lint, TypeScript dan build produksi biasa **lulus**. Source probe diarsipkan sebagai `.ts.txt`; spec sementara dihapus melalui finally, tidak ada suppressions atau perubahan aturan lint/typecheck.
- Smoke build produksi lokal **port 3300 lulus**: beranda dan rute P0 200/no-store, detail belum terbit 404, collection/global privat menolak anonim 403 dan dapat dibaca Admin 200. Pengujian ini tidak membuat konten resmi. Server lokal lain dipertahankan.
- `pnpm db:check`: koneksi runtime Supabase berhasil, TLS client encrypted/authorized true. Migrasi tambahan sudah diterapkan; data dan batas role seperti pemeriksaan di atas. Down migration tidak dijalankan.
- Pemeriksaan diff dan build publik tidak menemukan secret environment. Perubahan whitespace SQL pengguna tetap di luar commit.

Perbaikan arsip/restart tersimpan pada commit `27d617b`; CTA, pengujian dan pembaruan status disimpan terpisah. Tidak ada deploy/push atau perubahan baseline kebutuhan. Status audit awal tetap riwayat; kelulusan ini tidak menyatakan modul P1, audit menyeluruh keamanan/performa/aksesibilitas atau kelulusan MVP/produksi selesai. Advisori dependency moderate/low yang tercatat sebelumnya tetap mengikuti T053.
