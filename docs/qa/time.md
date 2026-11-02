# T055 — Waktu dan konkurensi

`final-time.test.mjs` menggunakan clock eksplisit di batas buka−1 ms, buka, tutup−1 ms, tutup dan tutup+1 ms. Rekrutmen buka inklusif/tutup eksklusif; event berpindah upcoming→ongoing→completed dan CTA mengikuti akhir event, confirmation serta cancellation. Fixture melewati tengah malam UTC/WIB dan batas tahun; kalender disimpan date-only, tanpa konversi hari.

`events`, `recruitment` dan `organization` unit/integration menguji invalid rollover, input WIB→UTC, range invalid, enabled terpisah dari isi, campaign mendatang/selesai dan maksimum satu active/enabled. `zzz-final-contract.test.mjs` menahan advisory graph lock, menunggu dua request benar-benar masuk antrean, lalu melepasnya untuk race publish sembilan jenis serta pilihan periode/kampanye. Hasil wajib satu 200 dan satu 409, bukan dua persetujuan/perubahan yang saling menimpa.

Browser `events-public`, `recruitment` dan `zz-p0-home` memanaskan halaman lalu melewati deadline nyata tanpa reload, termasuk CTA CMS + CTA utama sekaligus, disable, penggantian campaign, API gagal dan pageshow/visibility. Server memberikan deadline; client mengurangi durasi round-trip dan memakai clock monotonic. Reader/file/metadata tidak menghidupkan versi lama dari cache.

Tanggal analisis/album/prestasi diuji sebagai string kalender, termasuk 31 Desember dan filter tahun berikutnya. Clock terkendali dipakai untuk tabel batas deterministik; browser memakai timer server nyata. Tidak ada endpoint untuk mengubah clock produksi atau bypass aktivasi yang ditambahkan demi tes.
