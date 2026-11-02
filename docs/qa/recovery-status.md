# T060 — Status pemulihan

Proof restore lokal pada PostgreSQL 17.11 **lulus**: **80 tabel** dipulihkan dengan jumlah baris yang sama, **2 file publik** (PNG/PDF) cocok checksum dan tetap 200, **2 varian file privat** tetap 404, **9 tabel audit/izin** tetap menolak UPDATE oleh role runtime. Admin tetap dapat membaca bukti privat, anonim ditolak. Source tidak menjadi target restore.

Hasil mesin: `artifacts/recovery-proof.json`. Dump dan salinan media berada sementara di direktori privat run, lalu dibersihkan bersama target uji setelah guard. Jangan membagikan raw dump. Prosedur dan urutan konsistensi dijelaskan pada [backup/restore](../operations/backup-restore.md).

Latihan ini mencakup backup/restore berpasangan yang benar-benar dijalankan, bukan sekadar restart. Restore hosted/produksi, lokasi off-site/enkripsi, frekuensi/retensi, RPO/RTO, role operator dan uji pada hosting final tetap belum ditetapkan. Tidak ada restore/reset pada Supabase utama.
