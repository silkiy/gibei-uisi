# T052–T054 — Keamanan dan kegagalan

## Batas ancaman demo

Boundary yang diperiksa: request HTTP/cookie/origin → akun/role terbaru → operasi domain/transaksi → database/file privat → DTO/HTML/metadata publik. Aset yang dilindungi meliputi kredensial/sesi, owner/assignment, keputusan review, audit, bukti izin logo dan file draft. Tidak ada Supabase Auth, visitor account, formulir internal atau endpoint embed bebas yang ditambahkan.

| Risiko | Kontrol dan bukti aktual |
|---|---|
| Pemalsuan role/owner atau bypass Local API | Hook domain memeriksa aktor database; field allowlist, owner/assignee dan version checks. Suite accounts/articles/organization serta `zzz-final-contract.test.mjs` menguji request langsung. |
| Persetujuan usang/two writers | Manifest exact revision, graph lock dan optimistic version. Dua request benar-benar ditahan pada advisory-lock barrier lalu dilepas; satu 200 dan satu 409. |
| Cookie/sesi/lintas situs | Cookie HttpOnly/SameSite=Lax, token tidak dikirim dalam JSON. Localhost HTTP tidak memakai Secure; SERVER_URL HTTPS mengaktifkan Secure. Sesi diambil ulang dan perubahan akun mencabut sesi lama. Cross-origin PATCH dengan cookie ditolak; login salah berulang mengunci akun uji yang terpisah. |
| Input aktif/SQL/HTML/upload | Query terparameterisasi, slug/URL/date validation dan renderer allowlist. Gambar didecode/dioptimalkan, PDF aktif ditolak, batas ukuran/mime diterapkan. Test article-links/media-validation/uploads/input origin melengkapi tes browser rich text. |
| Draft/relasi/metadata/file bocor | Reader anonim approved-only, review manifest, no-store, akses byte langsung/HEAD/range/thumbnail/optimizer dievaluasi ulang, optional relation fallback dan required-relation withdrawal guards. |
| Log/error membocorkan secret | Logger CMS menyimpan event/kode/status aman, membuang pesan raw/SQL/params/header/cookie. Respons 5xx generik mempunyai X-Request-ID/correlationId; server read dibungkus error generik dan recovery UI. `safe-log.test.mjs` dan fault-injection API/browser membuktikannya. |
| Perubahan tanpa audit | Audit append-only dan transaksi bersama publikasi. Fault injection INSERT audit/SELECT reader serta rollback/restart/restore diuji pada target terisolasi. |

Tidak ada loading boundary di akar publik: ia dapat melakukan streaming sebelum keputusan 404. Loading UI ditempatkan pada daftar partnership; detail privat/withdrawn mempertahankan HTTP 404. Error boundary memakai `retry` sesuai guide Next 16.4.2 terpasang, termasuk fallback global untuk kegagalan root layout.

## Dependency aktual

Audit native `pnpm audit --json` sesudah pemasangan alat benchmark mencatat **0 critical, 0 high, 4 moderate dan 1 low** (hitungan native audit/dependency paths). Hasil lokal: `artifacts/t053-dependencies-final.json`; jalur dependensi pada `artifacts/t053-dependency-paths.txt`. Tidak ada skor keamanan nol temuan yang diklaim.

| Modul yang dilaporkan | Jangkauan/mitigasi demo | Tindak lanjut produksi |
|---|---|---|
| esbuild lama melalui migration tooling | Tidak menjalankan esbuild development server; aplikasi demo memakai Next production start pada loopback. | Tinjau pembaruan adapter/tooling dan jalankan regresi migrasi. |
| deepmerge (low) | Input domain memakai field/type allowlist; objek arbitrer editor tidak menjadi konfigurasi aplikasi. Belum ada versi patch yang ditunjukkan advisory. | Tinjau upstream Payload/deepmerge dan scope input ketika menambah fitur. |
| minimatch | Pola filesystem/build berasal dari konfigurasi sumber lokal, bukan input CMS/URL pengunjung. | Evaluasi patch kompatibel tanpa menukar major dependency secara buta. |
| glob melalui alat benchmark | Traversal alat lokal pada source tepercaya, bukan endpoint publik; timeout bukan boundary otorisasi file. | Tinjau versi tool sebelum pipeline/deployment final. |

Lighthouse adalah devDependency yang dipin; tidak menambahkan layanan eksternal atau dependency browser publik. Tidak ada upgrade framework/CMS massal hanya untuk mengecilkan angka audit. Temuan nonkritis tetap terbuka dan tercatat untuk review sebelum produksi.

## Batas verifikasi

Pengujian negatif menggunakan database/media/akun milik run, tidak menonaktifkan service pengguna atau menulis fixture ke Supabase. Proteksi brute force yang dibuktikan adalah lockout akun Payload; pembatasan IP/distributed traffic, CSP/nonce, HSTS/TLS proxy, monitoring dan kebijakan recovery produksi memerlukan penetapan infrastruktur. Situs demo tetap noindex dan loopback. Ini bukti kelulusan cakupan localhost, bukan sertifikasi keamanan produksi atau pentest eksternal.

## Perbaikan regresi startup CMS

SSR dan API Next dapat memuat instance modul berbeda. Trusted context marker memakai registry Symbol bernamespace yang sama antarbundle, tanpa mempercayai string/JSON client. Lima penanda bootstrap/audit/editorial/aktivasi diperbaiki bersama. Guard aktor, role, versi, transaksi dan endpoint tetap berlaku. Unit dua instance modul dan seluruh kontrak HTTP dengan startup SSR lebih dahulu lulus pada run final; lihat [T063](../reports/T063.md).
