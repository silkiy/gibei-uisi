# Panduan CMS demo

Buka `/admin` pada origin yang ditampilkan launcher. Gunakan akun bernama per orang/role; kredensial acak demo hanya ada pada berkas lokal privat yang ditunjuk launcher. Tidak ada pendaftaran mandiri atau password default. Pengunjung tidak memerlukan login.

## Media Communication

1. Buat draft pada Articles, Research Publications, Events, Recruitment Periods, Galleries, Partners atau Achievements. Pages/periode/divisi dibuat Admin lalu ditugaskan. Owner dan assignee boleh mengedit draft yang ditugaskan; Media lain tidak memperoleh hak hanya karena mengetahui ID.
2. Isi field konten dan simpan dengan **Save**. Periksa preview privat. Artikel memakai Title, Excerpt, Public Author dan editor rich text; identitas penulis publik terpisah dari akun CMS. Kategori/konfirmasi yang khusus Admin tidak dapat dipalsukan.
3. Upload media melalui Media. JPEG/PNG/WebP maksimum 5 MiB dan PDF maksimum 15 MiB; video berupa tautan HTTPS. File awal privat, immutable dan mengikuti manifest versi. Foto informatif harus memiliki alt; album menyimpan urutan/caption dalam review.
4. Pilih **Ajukan review** setelah semua perubahan tersimpan. Status `in_review` mengunci isi. Media dapat **Tarik pengajuan**, lalu menyunting kembali. Media tidak dapat menerbitkan, mengarsipkan, menarik publikasi atau menghapus permanen.
5. Jika Admin memilih **Minta revisi**, baca alasan pada panel, perbaiki, simpan dan ajukan ulang. Setelah konten terbit, gunakan **Buat revisi baru**. Revisi kerja tidak mengubah versi publik sebelum persetujuan baru.

## Admin

- Antrean review artikel berada pada daftar Articles. Gunakan **Tinjau**, **Preview privat**, alasan editorial dan **Minta revisi** atau **Terbitkan**. Koleksi lain memakai panel alur editorial pada dokumen. Persetujuan berlaku pada versi/manifest tertentu; konflik meminta muat ulang dan tinjau ulang, bukan menimpa perubahan.
- Owner/assignee ditentukan melalui field akun oleh Admin. Jangan membagikan login akun Admin kepada Media. Akun Users dapat dibuat/diubah Admin; perubahan role/status/email/password mencabut sesi lama. Sedikitnya satu Admin aktif harus tersisa.
- **Arsipkan revisi** hanya mengarsipkan draft/revision_required setelah pengajuan ditarik, tanpa menarik versi publik. **Tarik publikasi** memerlukan alasan dan menyembunyikan representasi publik. Draft dengan riwayat terbit tidak boleh dihapus untuk menghilangkan audit. **Mulai ulang dari arsip** hanya Admin dan tetap membutuhkan review baru.
- Organization State memilih maksimum satu periode terbit aktif. Recruitment State memilih maksimum satu kampanye enabled; nonaktifkan dahulu sebelum mengganti. Waktu buka inklusif/tutup eksklusif tetap berlaku meskipun kampanye enabled. Aktivasi tidak menerbitkan isi draft.
- Site Settings adalah konfigurasi langsung beraudit: nama/logo/favicon, SEO default, navigasi/footer dan kontak terkonfirmasi. Kontak yang belum terkonfirmasi disembunyikan. Isi Homepage/About tetap melalui Pages, terpisah dari konfigurasi.
- Logo mitra memerlukan **Catat izin logo** dengan alasan Admin, mengikat mitra serta versi/checksum file. Tanpa izin, nama/deskripsi terbit dapat tampil tanpa logo. **Cabut izin logo** memprioritaskan logo publik. Bukti izin/actor/waktu tidak menjadi data publik.

## Penanganan masalah

- Konflik 409: muat ulang, bandingkan isi/versi dan ulangi hanya setelah ditinjau. Jangan mengubah expected version secara manual untuk memaksa penyimpanan.
- File dicabut: website memberi fallback. Admin dapat revoke darurat melalui panel Media/manage API sesuai [setup](setup.md). Delete yang masih dirujuk mengembalikan daftar dependensi dan 409; retensi mencakup revisi/riwayat, bukan hanya konten publik saat ini.
- Kegagalan operasi: perubahan dan audit harus rollback bersama. Gunakan ID korelasi serta kode server untuk diagnosis; jangan menyalin raw connection string/token/password ke laporan.
- Reset password lokal dilakukan Admin melalui Users. Tidak ada pengiriman email pemulihan otomatis pada demo. Pemulihan akun produksi ditetapkan sebelum deployment.

Semua contoh yang ditampilkan demo bukan fakta organisasi. Pastikan sumber, izin foto/logo, nama pengurus, disclaimer dan kontak diverifikasi sebelum dipindahkan menjadi konten resmi.
