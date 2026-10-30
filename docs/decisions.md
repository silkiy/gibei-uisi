# Register Keputusan GIBEI UISI

**Tanggal persetujuan:** 23 Oktober 2026 (Asia/Jakarta)  
**Pihak penentu:** Pemilik proyek, melalui percakapan proyek ini  
**Acuan:** [PRD v1.1 §18](PRD-v1.1.md#18-decision-register--open-questions)  
**Status tugas per 30 Oktober 2026:** T001–T006 selesai; CP-01/CP-02 ditinjau dan T007 siap dikerjakan berikutnya.

## Bukti dan cakupan persetujuan

Pernyataan langsung pemilik proyek pada 23 Oktober 2026:

> T001 saya sudah setuju, silahkan anda lanjutkan dan tandai kita bisa next ke T002

Persetujuan T001 mencakup paket baseline D-01–D-10 yang menjadi kriteria selesai tugas tersebut. Persetujuan ini menetapkan kebutuhan pengembangan localhost; tidak menyatakan implementasi, pengujian, aset resmi, izin kelembagaan, atau deployment produksi sudah selesai/disetujui.

## Keputusan baseline

Seluruh keputusan berikut disetujui oleh pemilik proyek pada 23 Oktober 2026 dengan bukti pernyataan di atas.

| ID | Keputusan | Status | Dampak ke tugas berikutnya |
|---|---|---|---|
| D-01 | P0 dan P1 sama-sama wajib untuk MVP lengkap. | Disetujui | Seluruh modul pada T026–T048 tetap termasuk cakupan; T062 memeriksa MVP lengkap. |
| D-02 | Versi publik tetap tampil selama revisi; maksimum satu revisi kerja aktif. | Disetujui | T003 merancang model versi; T017 dan T021 membuktikan revisi serta konflik. |
| D-03 | Persetujuan sekaligus publish; Admin boleh menyetujui materi sendiri; tanpa jadwal publish. | Disetujui | T013–T015 dan T022 menggunakan alur persetujuan tersebut. |
| D-04 | Hak akses berdasarkan owner/assignee; akun hanya dibuat Admin; Media tidak menghapus permanen. | Disetujui | T006–T010 dan T020 menerapkan izin; T053–T054 memeriksa bypass API. |
| D-05 | Upload privat; persetujuan aset berbasis versi; akses dicabut setelah referensi publik terakhir hilang. | Disetujui | T003 dan T011–T020 mencakup file asli, turunan, reuse, dan pencabutan akses. |
| D-06 | Gambar maksimum 5 MiB dan PDF 15 MiB; hanya JPEG/PNG/WebP/PDF. | Disetujui | T011 menerapkan validasi format/ukuran dan ketentuan gambar lain pada §8.6 PRD. |
| D-07 | Maksimum satu periode terbit dipilih aktif dan satu kampanye terbit enabled; konfigurasi operasional terpisah dari versi editorial; waktu WIB. | Disetujui | T032 dan T038 mengamankan invariant; T035–T039 serta T055 menguji waktu/CTA. |
| D-08 | Slug dikunci setelah publikasi pertama. | Disetujui | T010/T017 menegakkan slug; redirect/perubahan URL tetap di luar MVP. |
| D-09 | Kondisi Lighthouse dan skenario kelulusan mengikuti §13–16 PRD. | Disetujui | T054–T058 dan T062 mengumpulkan bukti sesuai target, tanpa mengubah ambang diam-diam. |
| D-10 | Konfigurasi global hanya Admin; isi halaman mengikuti workflow editorial. | Disetujui | T026–T028 memisahkan Pages dan Site Settings; T040 memakai kontak konsisten. |

## Hal yang tetap terbuka

Persetujuan baseline tidak menggantikan konfirmasi informasi berikut dari PRD §18.2:

- Logo, warna/font resmi, brand guideline, serta izin foto.
- Periode aktif aktual, struktur, nama/jabatan, dan foto pengurus yang boleh dipublikasikan.
- Konten awal, sumber terverifikasi, serta rumusan disclaimer final organisasi.
- Identitas Admin operasional dan penanggung jawab serah terima.
- Email, lokasi, sosial, dan tautan pendaftaran yang dikonfirmasi.
- Izin penggunaan nama/logo mitra dan bukti privatnya.
- Domain, spesifikasi/izin hosting UISI, penyimpanan produksi, dan HTTPS.
- Frekuensi/retensi backup, target pemulihan, dan pemulihan akun produksi.
- Target waktu, kapasitas pengembang, dan jadwal validasi stakeholder organisasi.

Placeholder berlabel dapat dipakai untuk demo localhost sesuai PRD. Tidak ada versi paket atau rancangan implementasi yang dianggap telah diverifikasi oleh persetujuan ini.

## Pembaruan infrastruktur — 23 Oktober 2026

Pemilik proyek menyatakan “PostgreSQL/psql saya akan pakai supabase” dan memberikan [proyek lgqnxvldjqzgbfyxqonx](https://supabase.com/dashboard/project/lgqnxvldjqzgbfyxqonx). Ini menggantikan rencana PostgreSQL Docker lokal; aplikasi/CMS tetap localhost dan memakai adapter PostgreSQL Payload. Supabase Auth/Storage tidak ditambahkan oleh keputusan ini.

PRD §11, matriks T002 dan T005 diselaraskan. Docker yang dilaporkan sudah terpasang dan sedang diperbarui menjadi opsional. Versi server, akses/koneksi, role/schema serta isolasi pengujian masih harus diperiksa pada T003/T005/T008; belum ada perubahan remote atau migrasi dijalankan.

## Langkah berikutnya

**T002 selesai pada 23 Oktober 2026.** [Matriks stack](technical/stack.md) memuat pemeriksaan sumber resmi, metadata engine/peer dependency, runtime lokal, serta batas verifikasi. Ini merupakan hasil pemeriksaan teknis tersendiri setelah persetujuan T001, tanpa instalasi atau pengujian aplikasi.

**T003 selesai pada 23 Oktober 2026** atas permintaan pemilik proyek “kalau begitu selesaikan T003”. [Kontrak editorial](technical/editorial-architecture.md) dan [akses media](technical/media-access.md) mencatat rancangan implementasi, alasan memilih layanan editorial kustom, penelusuran artikel/PDF/dua revisi/penarikan, serta eksperimen pembuktian. Baseline produk tidak diubah dan tidak ada klaim runtime telah lulus.

**CP-01 telah ditinjau dan T004 selesai pada 26 Oktober 2026.** [Laporan T004](reports/T004.md) mencatat runtime LTS portable, kerangka, lockfile dan hasil lint/typecheck/build/browser. Penyesuaian pin TypeScript 7.0.2 ke 5.9.3 mengikuti bukti rentang dukungan parser ESLint; kebutuhan produk tidak berubah.

**T005 selesai pada 26 Oktober 2026.** [Laporan T005](reports/T005.md) mencatat koneksi PostgreSQL 17.11 dari localhost, TLS client, role/schema privat, migration dan pengujian transaksi/persistensi. Kredensial runtime/migrasi dipisahkan dan hanya disimpan lokal. Batas TLS internal pooler dan dua warning advisor bawaan tetap dicatat untuk audit berikutnya.

**T006 selesai pada 30 Oktober 2026.** [Laporan T006](reports/T006.md) membuktikan adapter/schema privat, migration, bootstrap satu Admin demo, login/logout API/browser serta penolakan akses anonim. DOMPurify dipatok ke patch aman 3.4.17 setelah audit; GraphQL tetap tidak diaktifkan. Akun demo tidak dianggap identitas Admin resmi organisasi.

**T007 siap dikerjakan.** CP-02 ditinjau. Kontrol akun/sesi lengkap dan audit perubahan akun masih T007; transaksi workflow/locking serta gateway file tetap dibuktikan sebelum T025. Temuan dependency tersisa, advisor bawaan dan TLS internal provider tidak dinyatakan telah selesai diaudit.
