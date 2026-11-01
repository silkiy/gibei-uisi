# Kontrak akses file — T003

Tanggal: 23 Oktober 2026. Status: rancangan selesai; belum ada file server, storage atau pengujian runtime. Acuan: [PRD §8.6](../PRD-v1.1.md), [kontrak editorial](editorial-architecture.md), dan [stack](stack.md).

## Identitas, penyimpanan dan metadata

Asset menyimpan ID opaque, owner/assignee, status processing/ready/failed, revokedAt nullable, fileVersion, checksum, MIME, ukuran, dimensi serta manifest varian. File ready immutable; upload pengganti selalu asset ID baru. Metadata alt/caption publik disalin ke revisi konten yang diulas; edit metadata library tidak mengubah halaman terbit.

Storage MVP berupa direktori persisten privat di luar `public/` dan static hosting. Path disusun dari ID server; jangan memakai nama asli sebagai path. Supabase pada keputusan saat ini hanya menyimpan database; tidak ada bucket publik yang diasumsikan. Permission OS dan route server menjadi batas akses file lokal.

Payload upload/thumbnail dapat membantu CMS, tetapi route file bawaan dan re-upload harus diperiksa atau ditutup. Dokumen [Uploads](https://payloadcms.com/docs/upload/overview) menjelaskan field file, varian dan operasi upload otomatis; itu bukan bukti seluruh jalur proyek sudah terlindungi. Sumber diperiksa 23 Oktober 2026. Route kustom yang lolos uji menjadi satu-satunya jalur byte; jangan membiarkan endpoint bawaan tetap menjadi bypass.

## Upload dan referensi

1. Sesi aktif diperlukan; tetapkan owner server. Streaming upload membatasi ukuran sebelum buffer penuh. JPEG/PNG/WebP maksimum 5 MiB dan 25 megapiksel; PDF maksimum 15 MiB. Periksa ekstensi, MIME dan signature; tolak SVG/HTML/executable/arsip serta input rusak. Decode gambar dan validasi isi sesuai format; PDF yang tidak dapat divalidasi ditolak, dan tidak dirender sebagai konten aktif.
2. Tulis staging privat, hasilkan hanya varian gambar yang diizinkan, verifikasi hasil lalu tandai ready. Kegagalan tetap privat dan dibersihkan secara aman; crash tidak menciptakan URL publik. Jangan menyebut pemeriksaan signature sebagai pemindaian malware.
3. Save/submit/publish memeriksa setiap assetId: milik/ditugaskan kepada actor atau masih sah publik, ready, tidak revoked dan fileVersion cocok. Publikasi oleh Admin dapat menyetujui asset privat yang boleh diaksesnya, tetapi tidak memutihkan referensi yang disisipkan editor tanpa izin saat simpan/submit.
4. Usage menyimpan revisionId/settings version, assetId, fileVersion, lokasi field dan alt/caption snapshot. Revisi historis tetap menghitung sebagai referensi untuk larangan delete, tetapi bukan alasan akses publik. Pisahkan aturan `referencedAnywhere` dan `publiclyUsed`.

## Keputusan akses per request

Usulan route: `GET/HEAD /api/media/{assetId}/{variant}` dengan variant allowlist, termasuk original; path arbitrary dan remote transform URL tidak diterima.

| Caller/kondisi | Keputusan |
|---|---|
| Anonim; ready, tidak revoked, ada usage dari current public revision atau settings aktif yang disetujui | Boleh baca byte dan metadata publik minimum. Approval lama tanpa penggunaan publik saat ini tidak cukup. |
| Admin aktif; ready, tidak revoked | Boleh preview privat. Metadata dan daftar dampak revoke tetap dapat diinspeksi Admin. |
| Media aktif owner/assignee; ready, tidak revoked | Boleh preview privat; metadata aset privat lain ditolak. Aset publik sah boleh digunakan ulang. |
| Revoked/failed/processing, atau caller tidak berizin | Tidak mengirim byte; route memberi 404 seragam. Tidak ada redirect ke lokasi storage. |

Resolver menghitung izin dari transaksi/snapshot DB saat request; `isPublic` tersimpan atau counter cache tidak boleh menjadi satu-satunya bukti. Lock protokol publish/withdraw/revoke mengikuti kontrak editorial. Aset ready yang sudah dicabut tidak dapat diterbitkan ulang lewat approval lama. Pemulihan darurat bukan fitur bypass; pengganti melalui asset baru dan review.

Semua varian, thumbnail CMS, transformasi, URL lama, HEAD, range PDF dan conditional request memakai resolver sama. Lakukan otorisasi sebelum 206/304 atau membaca file. Header `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`; PDF `Content-Disposition: attachment` dengan nama tampilan yang disanitasi. Byte stream yang sudah terkirim sebelum revoke tidak dapat ditarik kembali; request berikutnya selalu diperiksa ulang.

Gunakan gambar tanpa proxy optimizer Next (`unoptimized` atau elemen img dengan ukuran responsif); jangan mengizinkan `/_next/image` menyimpan salinan endpoint media. Turunan dihitung saat upload dan tetap di storage privat. Tidak ada public signed URL berumur panjang yang melampaui pencabutan. Default halaman/metadata/sitemap tetap memakai pembaca dinamis no-store pada kontrak editorial.

## Reuse, penarikan, penghapusan dan kegagalan

Publish menambahkan penggunaan publik hanya setelah blob dan varian ready; penggantian/withdraw mengubah public pointer dan usages dalam transaksi yang juga menulis audit. Settings logo/favicon merupakan persetujuan Admin beraudit, dengan validasi aset yang sama. Pencabutan terakhir menutup byte tanpa memerlukan pemindahan/penghapusan file fisik. Dua artikel berbagi file: penarikan satu tidak mencabut penggunaan yang lain.

Emergency revoke Admin mencatat alasan/audit dan revokedAt, mengalahkan semua penggunaan publik serta preview byte. Halaman memakai fallback aman dan CMS menampilkan daftar terdampak. Publish yang berlomba dengan revoke ditolak atau ter-serialize, tidak meninggalkan izin baru atas asset revoked.

Delete hanya Admin bila tidak ada referensi dalam revisi apa pun, riwayat, settings atau proses aktif. Tandai deleting/tombstone dan tutup penambahan referensi dalam transaksi; hapus blob sesudah commit. Gagal hapus fisik menghasilkan retry cleanup dan file tetap tak terlayani. Simpan audit tanpa cascade delete. Jangan menghapus blob dalam transaksi approval, karena filesystem tidak ikut rollback PostgreSQL.

## Risiko dan eksperimen wajib sebelum perluasan modul

Tabel ini menjadi target bukti implementasi, bukan hasil pengujian yang sudah lulus.

| Risiko/hipotesis | Percobaan dan hasil wajib | Tugas |
|---|---|---|
| Upload bawaan mengizinkan byte privat/re-upload | Request anonim/dua Media ke asli, thumbnail, transformasi, HEAD/range/conditional dan endpoint bawaan; nol byte privat, file approved tak dapat ditimpa; fault upload tetap privat | T011–T012, T015, T025 |
| Local API/REST/GraphQL melewati domain | Manipulasi status/pointer/owner/reviewer; panggil Local API atas nama Media, nested relations dan history; semua bypass ditolak | T013–T016, T021–T022, T025 |
| Submission tidak mengunci manifest | Edit saat in_review, tukar asset/hash, withdraw/resubmit lalu approve ID lama; reject tanpa mengubah publik | T013–T015, T021, T025 |
| Operasi Payload tidak berbagi transaksi | Fault injection pada usage/audit sesudah pointer update; DB rollback lengkap, public tetap versi lama | T015, T021, T025 |
| Race menyebabkan dua revisi/approval/izin stale | Barrier dua request create revision, dua approval, publish vs revoke/withdraw target, edit CAS; satu urutan konsisten atau 409, tidak lost update | T017–T021, T025 |
| Cache/optimizer menghidupkan file atau konten lama | Panaskan rute/daftar/metadata/media dan coba optimizer; withdraw/revoke lalu request ulang semua bentuk URL dan navigasi; 404/fallback tanpa salinan cache terlayani | T012, T016, T018–T020, T024–T025; ulangi T051 |
| Reuse dihitung keliru | Dua artikel berbagi PDF/gambar; tarik satu lalu terakhir; revoke aset pending approval; delete saat masih dirujuk revisi historis | T019–T020, T025 |
| Relasi membocorkan draft atau withdrawal berlomba | Target punya draft baru; reader hanya public target; wajib menahan withdrawal, opsional hilang; publish dependen vs withdraw target ter-serialize | T016, T018, T021, T025 |
| Supabase Data API melewati CMS | Periksa schemaName/migration, grants/exposed schemas; request anonim/authenticated langsung tidak membaca tabel privat; target reset terisolasi | T005–T008, T025, T053–T054 |

## Hasil penelusuran dokumen

**Pembaruan runtime 31 Oktober 2026:** T011–T020 telah diuji. Implementasi nyata ada pada `src/media/{validate,storage,access,references,retention,manage}.ts`, worker PDF dan route media; review/public reader berada pada `src/editorial/commands.ts` dan `src/content/public-read.ts`. Lihat [T012](../reports/T012.md), [T019](../reports/T019.md) dan [T020](../reports/T020.md). Ledger konfigurasi menahan penghapusan tetapi tidak memberi izin publik; Site Settings tetap T027. Uraian kontrak di bawah adalah baseline T003, sedangkan bukti runtime terkini ada pada laporan tersebut.

Skenario artikel R1/P1 → revisi R2/P2 → revisi pending R3 → withdraw terdapat pada [kontrak editorial](editorial-architecture.md#penelusuran-skenario-review-dokumen). Reuse/revoke/delete tetap memakai referensi versi. **Pembaruan T025:** race keputusan, UI dan HTML daftar/detail kini diuji bersama API/file; warm HTML menjadi 404/no-store setelah withdrawal dan revoke memberi fallback. Link internal Media pada rich text wajib ada dalam manifest Assets; URL gateway dipilih dari snapshot berizin. [Matriks T025](../qa/article-slice.md). SEO/sitemap T051 masih harus memakai reader yang sama dan mengulang invalidasi pada representasi baru tersebut.

**Perluasan T027:** Site Settings menyimpan versi/checksum logo dan favicon dari Media ready yang tervalidasi. Izin publik konfigurasi memerlukan kecocokan slot saat ini dan snapshot audit pada configVersion yang sama; ledger retensi saja tidak pernah memberi izin publik. Konfigurasi, audit dan ledger disimpan atomik. Referensi historis tetap menahan penghapusan, sementara pergantian slot menutup URL lama jika tidak ada pemakaian publik lain. Revoke tetap menutup semua jalur. Lihat [T027](../reports/T027.md).

**Perluasan T031–T035:** Foto pengurus, sampul/PDF riset dan poster event mengikuti manifest reviewed. Gateway memerlukan pointer publik, review approved pada editVersion yang sama, versi/checksum yang cocok dan file ready. Semua revisi serta manifest review historis menahan penghapusan tanpa memberi izin publik. Withdrawal/revoke menutup URL kecuali ada pemakaian publik lain yang sah. Tidak ada salinan melalui optimizer publik. Bukti lintas modul ada pada [T035](../reports/T035.md).
