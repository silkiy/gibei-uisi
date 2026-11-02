# T054 — Matriks izin lintas collection

`zzz-final-contract.test.mjs` menjalankan kontrak parametrik untuk **periods, divisions, members, research, events, recruitment, galleries, partners, achievements**. Actors: Admin, owner Media A, assignee Media B, Media lain baru, anonim. Articles dan Pages juga diuji melalui API/Local API/CMS pada suite yang sudah ada; tidak menganggap keberhasilan artikel otomatis membuktikan jenis lain.

| Operasi | Anonim | Owner | Assignee | Media lain | Admin |
|---|---|---|---|---|---|
| Baca root/draft CMS | ditolak | boleh | boleh | 404 | boleh |
| Edit draft versi benar | ditolak | boleh | boleh | ditolak | boleh |
| Ganti owner/assignee | ditolak | ditolak | ditolak | ditolak | boleh, beraudit |
| Edit saat in_review | ditolak | 409 | 409 | ditolak | 409 |
| Ajukan/tarik pengajuan berizin | ditolak | boleh | boleh | ditolak | boleh |
| Publish/minta revisi | ditolak | ditolak | ditolak | ditolak | exact submission saja |
| Arsipkan revisi/tarik publikasi | ditolak | ditolak | ditolak | ditolak | alasan wajib |
| Restart arsip tanpa publikasi | ditolak | ditolak | ditolak | ditolak | draft baru; review tetap wajib |
| Delete konten pernah terbit | ditolak | ditolak | ditolak | ditolak | 409, riwayat dipertahankan |
| Baca audit/bukti izin | ditolak | review berizin saja | review berizin saja | ditolak | sesuai koleksi privat |

Untuk shared reviewed, tiap jenis diuji sampai dua publish bersamaan pada barrier menghasilkan 200/409, revisi publik tidak berubah, withdrawal, archive/restart dan penolakan delete history. Pembuatan periode/divisi dan Pages tetap khusus Admin; jenis lain dapat dibuat Media sesuai baseline. Divisi mempunyai delapan identitas tetap.

Bukti pelengkap aktual:

- `accounts.test.mjs` dan `verify-editorial-local.ts`: current actor, last Admin, session revocation, Local API default override, context simbol tidak dapat dipalsukan JSON.
- `articles`, `review-submit`, `publish`, `published-revision`, `editorial-races`, `pages`, `z-archival`: versi, review, owner/assignment, notes, no direct publish, archive/restart, private preview dan rollback audit.
- `public-read`, `article-search`, `article-links`, `unpublish`, `deletion`: count/search/required+optional relations, target publik terkini, tombstone, metadata privat tidak bocor.
- `media-read`, `media-reuse`, `uploads`, `publications`, `p1`: original/thumbnail/HEAD/range/PDF/optimizer, referensi dua konten, foreign asset IDs, revoke/fallback/retention dan izin logo walau byte publik di konteks lain.
- `p1-seo.spec.ts`: canonical/OG/JSON-LD/sitemap hanya snapshot approved, termasuk penarikan URL hangat dan 404.
- `settings`, `organization`, `members`, `recruitment`: konfigurasi hanya Admin, audit, relasi wajib dan aktivasi terpisah.

Hasil dan jumlah run final dicatat pada [audit MVP](mvp-acceptance.md). Matriks ini menyatakan perilaku sesuai scope; bukan pemberian role database baru atau pembukaan schema Supabase kepada publik.
