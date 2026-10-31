# Pembuktian irisan artikel — T025

Lingkup: Fase B artikel, 31 Oktober 2026. Target uji adalah build produksi pada port loopback acak, PostgreSQL 17.11 baru dengan role runtime/migrator terpisah, Admin, dua Media dan browser pengunjung. Data/kredensial dibuat per run; Supabase pengembangan tidak di-reset atau diberi seed fixture.

**Hasil akhir:** 23 unit, 36 integration dan 22 e2e lulus; Local API, audit persistence setelah restart dan guarded cleanup lulus. Lint/TypeScript/frozen install/build produksi dan probe CMS/reader lokal lulus. [Laporan T025/CP-09](../reports/T025.md). Batas pengerjaan: selesai T025 dan berhenti sebelum T026.

## Matriks bukti

| Skenario | Bukti otomatis |
|---|---|
| Draft milik server, assignment/transfer dan penolakan Media lain | `tests/integration/articles.test.mjs`, `tests/e2e/articles.spec.ts` |
| Submit mengunci isi/versi/manifest; catatan revisi wajib; approval lama ditolak | `review-submit.test.mjs`, `publish.test.mjs`, `editorial-ui.spec.ts` |
| Draft → review → minta revisi → perbaiki → submit → publish → revisi baru → withdraw melalui CMS | `tests/e2e/article-workflow.spec.ts`, lulus bersama seluruh suite |
| Revisi kerja tidak mengubah body/title/asset versi publik; arsip/restart membutuhkan review baru | `published-revision.test.mjs`, `unpublish.test.mjs` |
| Race keputusan, save dan publish versus penarikan target wajib | `editorial-races.test.mjs`, barrier PostgreSQL dengan bukti kedua request mengantre sebelum release |
| Audit append-only, actor/waktu/revisi/state/alasan dan persistensi restart | `editorial-races.test.mjs`, pemeriksaan API/SQL setelah server uji dihentikan dan dijalankan ulang dalam harness |
| Rollback publish bila storage hilang atau INSERT audit gagal; tidak ada publikasi parsial | `publish.test.mjs` dengan fault injection terisolasi dan pemulihan finally |
| Upload signature/MIME/ukuran/dimensi/PDF aktif; metadata privat dan Local API bypass | `uploads.test.mjs`, `tests/unit/media.test.mjs`, `scripts/verify-editorial-local.ts` |
| Original/thumbnail/HEAD/range/conditional/optimizer tidak melewati izin | `media-read.test.mjs`, `media-reuse.test.mjs`, `deletion.test.mjs` |
| Reuse dua artikel; penarikan referensi terakhir; revoke sesudah submit | `media-reuse.test.mjs`, `unpublish.test.mjs` |
| Delete memeriksa draft/riwayat/review/configuration; revoke memberi fallback; gagal cleanup dapat diulang | `deletion.test.mjs` |
| Reader allowlist, target relasi hanya versi publik dan tidak ada draft pada search/count | `public-read.test.mjs`, `article-search.test.mjs` |
| PRD pagination 12/48, default input invalid, unknown category/out-of-range empty, mobile/keyboard | `tests/unit/article-search.test.mjs`, `tests/e2e/article-list.spec.ts` |
| Rich text/link/media aman, alt/sumber/tanggal/disclaimer, HTML dan file setelah revoke/withdraw | `tests/unit/article-links.test.mjs`, `tests/integration/article-links.test.mjs`, `tests/e2e/article-detail.spec.ts` |

Nama integration yang dipersingkat di atas berada pada `tests/integration/`. Semua integration dijalankan berurutan agar fault privilege audit tidak mengganggu test lain. Browser memakai context terpisah dan Chromium proyek tanpa profil pribadi. Preview hanya memuat ID pada URL dan memerlukan login/ownership, bukan token share.

## Reproduksi

Gunakan Node 24.22.1, pnpm 10.24.0, dependency frozen-lockfile dan backend uji pada [panduan testing](../testing.md). Jalankan `pnpm test:unit`, `pnpm test:all`, `pnpm lint`, `pnpm typecheck`, `pnpm build`. Jangan menjalankan dua harness bersamaan karena keduanya memakai `.next-test`. Log lokal `artifacts/test-run.log`, screenshot T023/T024 dan hasil Playwright diabaikan Git; assertion serta fixture untuk mengulangnya disimpan di repository.

## Batas bukti

- Kelulusan irisan artikel tidak menyatakan sebelas modul MVP atau kesiapan produksi selesai. Fase C dimulai pada T026; tidak ada Pages/Site Settings/event/organisasi/rekrutmen yang dibuat dalam batch T021–T025.
- Preview/katalog/detail memakai data pratinjau berlabel. Konten resmi/seed final mengikuti T049/T050. Fixture pengujian dibersihkan setelah run; daftar pengembangan boleh tetap kosong.
- Metadata publik saat ini bersifat generik/noindex dan tidak memuat draft. SEO per artikel, sitemap, audit Lighthouse/WCAG menyeluruh, restore dan deployment tetap mengikuti T051–T063. Saat representasi publik baru ditambah, ulangi pengujian withdrawal/cache pada representasi tersebut.
- Konfigurasi belum dapat memberikan izin byte publik; ledger T020 hanya retensi. T027 wajib menjaga ledger dan reader konfigurasi secara atomik dengan Site Settings.
- Race yang diuji adalah operasi editorial yang disebutkan pada matriks. Audit keamanan seluruh dependency dan jalur autentikasi tetap T053; empat advisori dependency dan warning provider yang sudah tercatat tidak dinyatakan selesai.
