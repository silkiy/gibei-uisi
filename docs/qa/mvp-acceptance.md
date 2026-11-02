# Audit MVP localhost — T062/T063

**Lulus secara teknis untuk demo localhost — 2 November 2026.** Bukti gabungan, clean start, naskah demo dan benchmark telah diperiksa; baseline PRD tidak dikurangi. Pemilik proyek belum memberikan penerimaan hasil demo akhir. Tidak ada persetujuan deployment produksi dalam dokumen ini.

## Cakupan fungsional

| PRD | Bukti aplikasi dan pengujian |
|---|---|
| FR-01 Homepage | Pages approved, About, program, publikasi/agenda, rekrutmen live, mitra/prestasi. `zz-p0-home`, `p1-seo`, seed dan naskah demo. |
| FR-02 Tentang | Pages snapshot + SEO, konfigurasi terpisah. `about-settings`, `pages`, `page-workflow`. |
| FR-03 Organisasi | Delapan divisi, pengurus, dua periode/arsip dan satu pilihan aktif. `organization`, `members`, `divisions`, `structure`, final-contract. |
| FR-04 Artikel | Katalog/search/filter/pagination, rich text aman, ownership/review/revisi/withdrawal. Suite artikel dan `article-workflow`. |
| FR-05 Riset | Analisis date-only, empat kategori awal, sumber, disclaimer tetap, PDF versi approved. `publications`, `research`. |
| FR-06 Kegiatan | Lokasi, WIB/UTC, status waktu/cancelled, arsip, CTA bersyarat. `publications`, `events-policy`, `events-public`. |
| FR-07 Galeri | Album urut, alt/caption, event opsional, video link, private file/revoke fallback. `p1`, `p1-seo`. |
| FR-08 Rekrutmen | Periode/divisi/posisi/syarat/tahapan, satu enabled, deadline, arsip. `recruitment`, `zz-p0-home`, final-contract. |
| FR-09 Partnership | Review, website valid, homepage choice dan izin logo Admin privat. `p1`, `p1-seo`, final-contract. |
| FR-10 Kontak | Site Settings terkonfirmasi, satu sumber header/footer/kontak, tanpa formulir. `settings`, `about-settings`, `zz-p0-home`. |
| FR-11 Prestasi | Review, date-only/filter tahun, dokumentasi dan withdrawal. `p1`, `p1-seo`, final-contract. |

Nama file di bawah berada di `tests/integration`, `tests/e2e`, `tests/unit` atau scripts, sesuai suffix dalam repository. Semua berjalan pada run-owned database/media, bukan fixture hosted.

## Acceptance scenario AC-01–AC-29

| AC | Bukti hasil yang diperiksa |
|---|---|
| 01 | `articles`, `review-submit`, `article-workflow`, final-contract: pengajuan tidak menerbitkan, hanya exact decision Admin. |
| 02 | `accounts`, `publish`, final-contract: current role, forbidden publish, forged owner/assignment/status/audit. |
| 03 | `articles`, `pages`, final-contract: akses owner/assignee/Media lain pada semua jenis relevan. |
| 04 | `review-submit` dan `article-workflow`: permintaan revisi tanpa catatan ditolak; catatan valid menghasilkan revision_required dan hanya aktor berizin yang membaca catatan privat. |
| 05 | `public-read`, `article-search`, `article-links`, `p1-seo`: draft tidak muncul pada HTML/API/count/relasi/metadata/sitemap. |
| 06 | `uploads`, `media-read`, `media`, final-contract: file awal privat dan gallery foreign asset ID ditolak. |
| 07 | `publish`, `publications`, `p1`: file/checksum/alt/caption terikat snapshot yang disetujui. |
| 08 | `published-revision`, `article-workflow`, `page-workflow`, final-contract: revisi kerja mempertahankan isi/metadata/aset snapshot publik sampai persetujuan baru. |
| 09 | `editorial-races`, final-contract dengan advisory barrier: satu commit dan satu 409 pada keputusan/penyimpanan bersamaan. |
| 10 | `unpublish`, `article-detail`, `p1-seo`: URL hangat menjadi 404, indeks/metadata/file tidak menghidupkan konten ditarik. |
| 11 | `media-reuse`, `unpublish`, `p1`: file tetap publik selama ada referensi publik lain; ditutup setelah terakhir. |
| 12 | `deletion`, `media-reuse`, `p1-seo`: delete media yang dirujuk ditolak, termasuk retensi revisi lama/config. |
| 13 | `uploads`, `media-validation`: batas ukuran/type, signature, decode gambar/PDF aktif, filename unsafe. |
| 14 | `recruitment`, `final-time`, `zz-p0-home`: buka inklusif, tutup eksklusif, enabled/URL confirmed dan kegagalan revalidasi. |
| 15 | `events-policy`, `events-public`, `final-time`: before/at/after start/end, cancelled dan jendela pendaftaran. |
| 16 | `organization`, `members`, `structure`, final-contract: kalender, periode, pengurus dan pilihan aktif. |
| 17 | `accounts`, `auth`, final-contract: inactive/role/password session invalidation, login lockout dan cookie/origin. |
| 18 | `article-search`, `article-list`, `research`: pencarian/filter/pagination dan hasil kosong. |
| 19 | `public-shell`, `zzz-final-a11y`: 18 URL, lima viewport, keyboard/zoom/reduced motion, audit dan screenshot. |
| 20 | `publications`, `research`, `research-policy`: tanggal analisis, sumber dan disclaimer dasar tidak dapat dihapus. |
| 21 | `settings`, `about-settings`, `zz-p0-home`: konfigurasi Admin beraudit dan kontak/sosial terkonfirmasi konsisten. |
| 22 | `zz-seed`, run-tests restart proof, clean-start export/install/demo: seed tidak duplikat/timpa edit dan data/file persisten. |
| 23 | `article-links`, `rendering`, `uploads`, `article-detail`: input aktif tidak menjadi script/iframe, HTTPS dan renderer allowlist. |
| 24 | `p1`, `p1-seo`: album, filter tahun dan mitra tanpa/dengan izin logo, alt/caption approved. |
| 25 | `publish`, `pages`, `settings`, `organization`, final-contract dan recovery UI: fault injection rollback, generik error/log aman. |
| 26 | `unpublish`, `members`, `structure`: mandatory public dependents menolak withdrawal, optional relations fallback. |
| 27 | `review-submit`, `media-reuse`, `p1`: asset lintas owner, version/checksum dan retained manifests. |
| 28 | `members`, `structure`, final-contract: perpindahan/dua pemilihan periode dengan satu state atomik. |
| 29 | `recruitment`, final-contract: disable sebelum switch dan dua aktivasi bersamaan pada barrier. |

## Bukti final dan Definition of Done

Hasil aktual: **39 unit, 80 integration, 42 browser, tanpa retry/skip** (`artifacts/t063-cold-start-full.log` (39 unit/ringkasan) dan `artifacts/t063-final-runtime.log` (integration/browser/restore)). Lint/typecheck/build lulus; koreksi link recovery sesudah suite diverifikasi ulang melalui `artifacts/final-recovery-ui.json` dan build. Clean start/frozen install dari source baru lulus; `artifacts/clean-start-source.json` mencatat parent commit `9e615bf` dan hash snapshot kerja baru yang sudah memuat perbaikan antar-bundle. Ini bukan klaim benchmark terhadap commit parent yang bersih. `artifacts/recovery-proof.json`: 80 tabel, dua file publik/checksum, dua varian privat ditolak, sembilan ACL audit tetap immutable. `artifacts/demo-handover.json`: 13 rute, empat aktor dan siklus editorial CMS lulus. `artifacts/lighthouse/summary.json`: 24 artikel seed tetap; median 88/87/86/89. Acuan rinci: [keamanan](security.md), [matriks izin](access-matrix.md), [waktu](time.md), [aksesibilitas](accessibility.md), [pemulihan](recovery-status.md), [performa](performance.md), [clean start](clean-start.md).

DoD localhost: sebelas modul/rute; delapan divisi/arsip organisasi; matriks role; exact revision/review; draft/file privat; withdrawal/revoke/cache/waktu; seluruh AC; responsivitas/aksesibilitas/performa; SEO; setup/seed/restart; panduan CMS/backup; label contoh. Seluruh 12 butir DoD teknis localhost lulus dengan pemetaan berikut.

| DoD §16 | Hasil aktual / bukti |
|---|---|
| 1–2 | Sebelas modul, delapan divisi dan riwayat periode: suite modul + demo-check 13 rute. |
| 3–4 | Role/API/exact revision: suite editorial, Pages dan final-contract, naskah empat aktor. |
| 5–6 | Draft/media/audit privat; withdrawal/revoke/relasi/cache/waktu: media, unpublish, p1-seo, final-time dan final-contract. |
| 7 | AC-01–AC-29 pada tabel di atas lulus pada suite gabungan. |
| 8 | 18 URL × lima lebar, keyboard/200%/axe; empat median Lighthouse ≥85. |
| 9 | Metadata/canonical/robots/sitemap/JSON-LD dan penarikan: p1-seo + suite publik. |
| 10 | Clean source/frozen install/build/demo, seed ulang dan restart DB/media lulus. |
| 11 | Setup/migration/akun/CMS dan backup/restore tersedia; restore terpisah benar-benar dijalankan. |
| 12 | Label contoh dan privasi diperiksa pada seed/SEO/browser/secret scan; materi resmi belum diisi. |

**Tetap terpisah:** penerimaan pemilik proyek, identitas/konten/izin resmi, deployment/domain/hosting, HTTPS dan secret produksi, backup/restore pada hosting final, RPO/RTO serta recovery akun produksi. Keterbatasan audit dependency nonkritis dan pemeriksaan pembaca layar dicatat pada laporan terkait. Perubahan UI/fitur minggu berikutnya memerlukan regresi serta pengukuran ulang yang terdampak.
