# Fondasi visual publik — T009

## Arah

Situs organisasi kampus dengan susunan editorial yang tenang: hijau tua sebagai tinta, hijau limau sebagai aksen, latar terang, garis pemisah dan tipografi yang tegas. Halaman membantu pembaca mengenali GIBEI UISI, menemukan publikasi dan melihat agenda. Tidak memakai statistik, testimoni, mitra atau tanggal kegiatan yang belum dikonfirmasi.

Hierarki halaman: pemberitahuan pratinjau → identitas/navigasi → pembuka → pengantar organisasi → publikasi kosong → agenda kosong → catatan edukasi → footer. Ini fondasi layout, bukan homepage lengkap FR-01 atau tampilan konten CMS final.

## Token sementara

| Token | Nilai | Pemakaian |
|---|---|---|
| Ink | `#123e31` | Teks utama, panel ilustrasi, tombol, footer |
| Paper | `#f8f9f3` | Latar dan teks di bidang gelap |
| Lime | `#d3ed8b` | Aksen ilustrasi, label footer |
| Muted | `#56695e` | Teks pendukung |
| Line | `#d7dfd4` | Batas kelompok konten |
| Surface | `#eaf0e1` | Bidang pengantar dan status |
| Focus | `#367456` / Lime | Outline 3px pada bidang terang/gelap |

Tipografi: **Manrope variable 5.3.0** dari Fontsource, lisensi OFL-1.1; berkas Latin WOFF2 dilayani lokal melalui next/font/local. Salinan lisensi tersedia di public/font-licenses/manrope-OFL.txt. Browser dan build tidak perlu mengunduh font Google. Fallback Arial/sans-serif. H1 responsif 2,45–4,6rem, H2 1,9–2,8rem. Ukuran label lebih kecil dibedakan dengan bobot dan spasi huruf; isi menggunakan line-height 1,6–1,8.

Komposisi memakai container maksimum 80rem, gutter 1,5rem pada ponsel dan 2,5rem mulai tablet. Radius panel/tombol **0**, tanpa bayangan. Titik status memakai lingkaran sebagai indikator dengan label teks. Header dan CTA memiliki target sentuh minimal 44px. Batas navigasi desktop 1024px; bagian pembuka menjadi dua kolom mulai tablet 768px.

Tailwind CSS/plugin PostCSS 4.3.3 dipasang; PostCSS 8.5.28 dipilih setelah percobaan 8.5.16 menambah advisory. Token Tailwind dipetakan pada CSS publik; pemindaian class dibatasi ke halaman dan komponen publik. Layout editorial memakai CSS khusus agar hierarki dan jarak konsisten. CSS/preflight hanya diimpor layout `(public)`, bukan layout Payload.

## Identitas dan isi yang belum final

Wordmark berupa teks GIBEI/UISI, bukan rekonstruksi logo resmi. Folder logo/foto yang dapat digunakan tidak ditemukan pada workspace saat T009; catatan memori lama tidak dijadikan bukti aset tersedia. Ilustrasi buku adalah SVG konseptual yang dibuat untuk pratinjau, bukan foto kegiatan, logo mitra atau file unggahan CMS. Pemberitahuan pratinjau terlihat di atas header. Warna, font, logo, naskah profil dan rumusan disclaimer tetap menunggu validasi organisasi.

Tautan navigasi sementara menunjuk anchor yang benar-benar tersedia: Tentang, Publikasi, Agenda dan Kontak. Footer tidak mengarang email/nomor telepon/akun sosial. Publikasi dan agenda memakai EmptyState; tidak ada tombol yang berpura-pura membuka artikel/event yang belum ada. Hubungan ke Site Settings dan versi terbit mengikuti tugas editorial berikutnya.

## Interaksi dan aksesibilitas

- Skip link pertama pada urutan Tab memindahkan fokus ke main.
- Menu mobile berupa disclosure dalam alur halaman, bukan dialog modal. Tombol memakai aria-expanded/aria-controls dan label Buka/Tutup; Tab mengikuti urutan alami tanpa focus trap.
- Escape menutup menu dan mengembalikan fokus ke tombol. Memilih bagian menutup menu, mengubah hash dan memfokuskan section tujuan. Fokus elemen interaktif terlihat; setiap landmark dan heading memiliki struktur yang jelas.
- Tidak ada animasi otomatis. Transisi warna ringan dan smooth scroll dihentikan pada prefers-reduced-motion.
- Semua bidang penting memakai teks selain warna; ilustrasi memiliki deskripsi dan bagian SVG dekoratif tidak dibacakan dua kali.

Pratinjau tidak menyatakan kepatuhan WCAG penuh hanya dari tes otomatis. Verifikasi runtime, ukuran layar dan temuan audit dicatat pada [laporan T009](reports/T009.md); audit menyeluruh sebelum rilis tetap mengikuti backlog.

Sumber: [Tailwind PostCSS](https://tailwindcss.com/docs/installation/using-postcss), [Fontsource Manrope](https://fontsource.org/fonts/manrope), guide CSS/Link/Font Next 16.4.2 yang terpasang, dan [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing).

## Perluasan artikel — T023/T024

Daftar memakai baris editorial dengan kategori/tanggal di sisi kiri pada desktop dan susunan vertikal pada mobile. Form pencarian, kategori dan ukuran halaman adalah GET sehingga URL dapat disalin tanpa token; pagination mempertahankan filter. Detail dibatasi 52rem agar body nyaman dibaca, dengan penulis/tanggal, label pratinjau, caption, sumber dan catatan edukasi. Tautan fokus terlihat; gambar tetap melewati gateway izin dan menyimpan proporsi asal. Link internal tidak melakukan prefetch konten editorial.

Screenshot fixture desktop 1440px/mobile 375px di `artifacts/T023-*.png` dan `T024-*.png` telah diinspeksi. Gambar blok warna adalah fixture uji berlabel, bukan foto organisasi. Axe terarah/keyboard/reflow melengkapi pemeriksaan visual; audit menyeluruh tetap T056. CMS memakai komponen Payload, sementara CSS publik tetap terpisah.

## Tentang dan divisi — T028/T030

Halaman memakai tipografi dan warna kerangka yang sama, dengan kolom baca 64rem, pemisah antarbagiannya dan paragraf yang mempertahankan baris baru. About menyajikan profil/sejarah/visi/misi dari snapshot terbit; divisi menampilkan label contoh, profil dan program kerja tanpa syarat rekrutmen. Header/footer memakai satu sumber identitas, navigasi dan kontak terkonfirmasi. Screenshot About 375px dan divisi 375px/1440px telah diinspeksi pada `artifacts/T028-mobile.png` dan `T030-*.png`. Tidak ada aset/kontak/pengurus contoh yang dianggap resmi.

## Struktur dan riset — T031/T034

Struktur menyediakan pilihan periode dan arsip, jabatan tanpa divisi, label contoh dan fallback foto. Riset memakai pola pencarian/pagination artikel, dengan tanggal analisis dan publikasi terpisah, referensi serta disclaimer tetap pada detail. Screenshot `artifacts/T031-mobile.png` dan `artifacts/T034-mobile.png` pada 375px telah diinspeksi tanpa overflow. Pemeriksaan ini bukan audit Lighthouse atau aksesibilitas menyeluruh; T056 tetap terbuka. Avatar CMS memakai ikon lokal agar tidak bergantung pada permintaan Gravatar.
