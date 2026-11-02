# Naskah demo localhost

## Persiapan

Ikuti [setup](setup.md) dan [demo data](demo-data.md), jalankan `pnpm demo --benchmark`. Catat origin aktual pada terminal; jangan mengasumsikan port 3000 atau menghentikan server lain. Buka empat konteks browser terpisah: Admin, Media owner, Media lain, dan pengunjung anonim. Akun hanya dibaca dari berkas privat lokal, tidak ditampilkan dalam presentasi.

## Alur presentasi

1. Sebagai pengunjung, buka beranda, Tentang, struktur/periode, delapan divisi, artikel/riset, kegiatan/arsip, galeri, rekrutmen, partnership, prestasi dan kontak. Tunjukkan label **contoh/pratinjau**, disclaimer riset, filter tahun dan kontak kosong yang tidak diklaim resmi. Logo mitra tanpa izin tidak ditampilkan.
2. Media owner membuat artikel contoh di CMS: slug, title, excerpt, public author dan rich text; simpan. Admin menentukan kategori bila diperlukan. Tunjukkan detail publik masih 404 dan Media lain tidak dapat membaca draft melalui API/preview.
3. Media mengajukan review. Admin membaca snapshot preview, mengisi alasan dan meminta revisi. Media memperbaiki, menyimpan dan mengajukan kembali. Admin menerbitkan. Pengunjung kini dapat membaca artikel.
4. Media membuat revisi baru dengan judul yang berbeda. Pengunjung tetap melihat judul/isi publik sebelumnya. Tunjukkan konflik versi jika mencoba memakai keputusan/request usang, tanpa memaksa perubahan.
5. Admin mengisi alasan dan menarik publikasi. Detail menjadi 404; daftar/pencarian/sitemap/metadata tidak memuatnya. Revisi dan audit tetap tersimpan. Jika file hanya dipakai publikasi tersebut, akses publik original/thumbnail/PDF juga berakhir; file dengan referensi publik sah lain tetap tersedia.
6. Tunjukkan album/alt/caption melalui preview privat dan publik; lalu izin logo mitra khusus Admin, pilihan periode dan aktivasi rekrutmen yang terpisah dari isi editorial. Pendaftaran tertutup/tidak terkonfirmasi tidak mempunyai CTA aktif.
7. Tunjukkan Users: assignment, reset lokal dan penonaktifan akun oleh Admin. Sesi lama tidak boleh tetap berizin; perlindungan Admin terakhir tetap berlaku. Jangan melakukan reset akun yang digunakan peserta lain.

## Pemeriksaan yang dapat diulang

`node scripts/demo-check.mjs PATH_KE_DEMO_ENV` menjalankan navigasi seluruh modul dan alur CMS pada empat konteks Chromium dengan berkas demo milik launcher. Hasil aman ditulis ke `artifacts/demo-handover.json` dan screenshot artikel publik, tanpa trace/video/cookie/password. Artikel latihan ditarik pada akhir alur sehingga 24 artikel benchmark publik tetap tersedia. Gunakan dataset yang sama sebelum pengukuran Lighthouse; jangan mengedit konten saat benchmark berjalan.

Penolakan akses API, batas waktu, race, revoke, rollback audit, keyboard dan restore juga mempunyai bukti pada suite final. Naskah ini bukan pengganti audit penerimaan pada [matriks MVP](qa/mvp-acceptance.md).

## Penutupan presentasi

Sampaikan hasil aktual, batas yang masih terbuka, lokasi panduan dan rencana tahap produksi. Catat penerimaan pemilik proyek hanya setelah benar-benar dinyatakan. Jangan mengklaim domain/hosting/HTTPS produksi, aset resmi, kebijakan backup atau fitur tambahan sudah disetujui.
