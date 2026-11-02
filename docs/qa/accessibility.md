# T056 — Responsivitas dan aksesibilitas

Keluarga halaman yang diperiksa oleh `zzz-final-a11y.spec.ts`: beranda, Tentang, struktur/periode, daftar/detail divisi, publikasi, daftar/detail artikel, daftar/detail riset, daftar/detail kegiatan, daftar/detail album, rekrutmen, partnership, prestasi dan kontak (**18 URL**).

- Lima lebar: **320, 375, 768, 1024, 1440 px**; total 90 navigasi, satu h1 dalam main, tanpa scroll horizontal atau pageerror.
- Seluruh 18 URL: axe WCAG 2 A/AA, 2.1 A/AA dan 2.2 AA; keyboard skip-link→main dan **200% ukuran teks** dengan reflow pada viewport 1024 px.
- Menu mobile: Tab, Enter, Escape, pengembalian fokus, fokus tujuan anchor; reduced motion dan indikator fokus diuji pada `public-shell.spec.ts`.
- Form filter/search, label dan empty state pada suite artikel/riset/event/struktur/prestasi; alt/caption, link eksternal, preview privat dan feedback konflik pada suite modul.
- Kegagalan database pada target uji menampilkan recovery UI; tombol **Coba lagi** memulihkan halaman setelah izin kembali. Detail privat/withdrawn tetap 404.

Audit menemukan target klik footer terlalu rapat saat kontak sudah dikonfirmasi. Perbaikan dibatasi pada satu rule CSS footer: minimum tinggi 44 px dan lebar 24 px. Aturan pemeriksaan tidak dihapus/dikecualikan dan konten kontak tetap tampil.

Artefak aktual: `artifacts/a11y-width-<width>.json`, `artifacts/a11y-final.json`, `artifacts/T056-contact-mobile.png`, screenshot modul dan laporan run gabungan final. Hasil lulus akhir dicatat pada [audit MVP](mvp-acceptance.md), sesudah pemeriksaan ulang dengan koreksi footer.

Pemeriksaan ini menggabungkan audit otomatis dengan navigasi keyboard/zoom nyata melalui Chromium dan tinjauan screenshot oleh agent. Belum ada studi usability dengan pengguna, pembacaan manual memakai NVDA/VoiceOver, pengujian semua kombinasi browser/perangkat atau sertifikasi WCAG eksternal. Label dan gambar contoh akan perlu ditinjau kembali ketika materi resmi/UI baru dimasukkan.
