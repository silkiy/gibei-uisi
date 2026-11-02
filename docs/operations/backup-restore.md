# Backup dan pemulihan database + media

Database dan `storage/private` adalah satu pasangan. Salinan database saja tidak memulihkan foto/PDF, dan salinan folder file tidak memberikan izin publik tanpa snapshot approval yang sah. Backup mengandung hash password, sesi, data akun, audit dan bukti izin: simpan privat dan jangan unggah ke Git/chat.

## Snapshot yang konsisten

1. Identifikasi environment, nama database, role dan direktori media aktual. Untuk demo harness, root media adalah `.tools/test-databases/<run-id>/assets`; untuk aplikasi utama adalah `storage/private`.
2. Tutup penulisan CMS/upload dan hentikan **hanya proses aplikasi milik environment tersebut**. Jangan mematikan database bersama atau layanan lain. Pastikan tidak ada worker/import lain yang menulis.
3. Gunakan `pg_dump` versi PostgreSQL yang sesuai dalam format custom (`-Fc`), lalu salin root media ke direktori backup baru. Gunakan environment/berkas password lokal dengan ACL terbatas, bukan password pada argumen CLI. Contoh bentuk perintah, dengan parameter target yang telah diverifikasi:

   ```text
   pg_dump --host HOST --port PORT --username BACKUP_ROLE --dbname SOURCE_DB --format=custom --no-owner --schema=payload --file=database.dump
   ```

4. Catat waktu, versi aplikasi/migrasi, versi PostgreSQL, file count, checksum dump dan checksum setiap file. Simpan manifest bersama pasangan database/media, bukan secret. Jika proses gagal di tengah, tandai snapshot belum lengkap.
5. Buka kembali aplikasi setelah dump dan salinan media selesai. Jangan menghapus source atau backup lama hanya karena `pg_dump` menghasilkan sebuah file.

Untuk Supabase, gunakan connection string migrasi/backup server dengan TLS terverifikasi. Jangan menonaktifkan verifikasi CA. Backup hosted belum dijalankan oleh batch demo ini; kuota/fitur backup penyedia dan role backup produksi harus diperiksa saat menentukan hosting.

## Restore ke target terpisah

1. Buat database dan direktori media **baru/kosong** dengan nama/environment eksplisit. Tolak hostname produksi atau source database pada script uji. Tidak memakai `--clean` pada database kerja.
2. Siapkan role yang sesuai, schema ownership dan koneksi aplikasi target. `--no-owner` memungkinkan role pemilik target berbeda; **jangan menghapus ACL tanpa menerapkan kembali grant/revoke dan mengujinya**.
3. Jalankan `pg_restore --exit-on-error --no-owner --dbname TARGET_DB database.dump`. Pulihkan media ke root target yang benar; jangan menggabungkan folder backup berbeda.
4. Periksa jumlah tabel/baris, pointer publik, audit, jumlah migrasi dan checksum file. Periksa runtime tidak dapat UPDATE/DELETE audit, anon/authenticated tidak dapat membaca schema privat, serta private preview tetap memerlukan akun yang berizin.
5. Nyalakan aplikasi target pada port berbeda. File publik harus 200 dan checksum cocok; original/thumbnail/PDF privat harus 404 untuk anonim. Konten draft tidak boleh muncul di HTML/API/metadata/sitemap. Uji login dengan secret input lokal, tanpa menyalin cookie browser antar environment.
6. Sumber tetap dipertahankan. Pemindahan traffic produksi hanya setelah verifikasi, keputusan operator dan rencana rollback tersendiri.

## Bukti demo dan batas produksi

`scripts/database/recovery-proof.mjs` dijalankan oleh `pnpm test:all`/integration pada PostgreSQL native milik harness: aplikasi source berhenti sebelum snapshot, dump + media disalin, database baru dibuat, seluruh jumlah baris dibandingkan, file dan ACL diuji melalui aplikasi yang benar-benar berjalan. Password hanya melalui environment subprocess. Target restore dihapus hanya setelah marker/path/database cocok; source tidak di-restore/reset oleh proof. Ringkasan aktual berada di `artifacts/recovery-proof.json` setelah run lulus.

Backup hosted/produksi, enkripsi dan lokasi backup off-site, frekuensi, retensi, RPO/RTO, pemegang akses, serta uji restore pada infrastruktur final **belum diputuskan**. Keberhasilan proof lokal tidak menggantikan latihan pemulihan produksi.
