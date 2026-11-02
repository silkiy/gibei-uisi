# Serah terima demo GIBEI UISI

Demo localhost mencakup sebelas modul PRD dan CMS dua role. Acuan hasil adalah [audit MVP](qa/mvp-acceptance.md), [setup](setup.md), [panduan CMS](cms-guide.md), [naskah demo](demo-script.md), [seed](demo-data.md), dan [backup/restore](operations/backup-restore.md).

## Akun dan konten

- Tetapkan akun bernama bagi pengelola berikutnya. Admin membuat pengganti, memeriksa akses, memindahkan ownership/assignment, lalu menonaktifkan akun lama. Jangan menyerahkan password melalui dokumen/Git/chat.
- Jika kredensial dibagikan di luar mekanisme yang disepakati, lakukan reset lokal melalui Admin dan verifikasi sesi lama dicabut. Pemulihan akun serta email produksi belum tersedia pada demo.
- Konfirmasi kontak baru melalui Site Settings. Periksa semua tempat yang menggunakan sumber yang sama (header/footer/kontak), lalu keluarkan kontak lama melalui penyimpanan beraudit.
- Data seed berlabel contoh tidak boleh dijadikan pengurus/mitra/prestasi resmi tanpa verifikasi. Aset media dan bukti izin logo tidak diganti diam-diam; publikasi baru harus mengikuti review/izin yang relevan.

## Rencana setelah demo

Pemilik proyek menetapkan fokus penyelesaian demo pada **2 November 2026**, kemudian persiapan deployment produksi pada minggu mulai **9 November 2026**. Perubahan tampilan dan fitur tambahan dapat masuk tahap tersebut setelah ruang lingkup serta kriterianya ditetapkan. Ini rencana kerja, bukan persetujuan untuk menerbitkan sekarang.

Sebelum deployment tentukan hosting/domain, akses operator, penyimpanan media persisten, HTTPS/reverse proxy, secret produksi terpisah, backup/off-site/retensi/RPO-RTO, uji restore pada target final, recovery akun, logging/monitoring dan validasi konten/izin resmi. Aktifkan indeks mesin pencari hanya setelah domain/konten benar; mode demo tetap noindex. Temuan dependency nonkritis beserta mitigasi dicatat pada audit keamanan dan harus ditinjau kembali sebelum produksi.

Baseline demo beserta bukti dijaga sebagai acuan regresi. Perubahan baru dicatat pada backlog berikutnya, dengan dampak ke schema, akses, editorial, UI, pengujian dan operasi. Tidak ada deployment, pembelian domain, akun eksternal baru atau secret produksi yang dibuat sebagai bagian penyerahan localhost.

**Penerimaan pemilik proyek:** menunggu peninjauan hasil demo; tidak disimpulkan dari keberhasilan tes atau dari permintaan untuk mengerjakan tugas.
