# T057–T058 — Lighthouse mobile

**Lulus — 2 November 2026.** Target PRD tetap median minimal **85** pada `/`, `/publikasi/artikel`, `/publikasi/artikel/demo-artikel-01` dan `/kegiatan`. Tidak menandai kelulusan berdasarkan production build saja.

Metode `scripts/benchmark.mjs`:

- Next production start, fresh benchmark seed **24 artikel publik**, seluruh modul demo terisi. Tolak target dengan dataset artikel lain/campuran.
- Lighthouse **13.6.0**, Chromium yang dipasang Playwright. Versi browser, CPU, OS, memori, tanggal, origin, source commit, dataset hash dan configSettings dicatat otomatis.
- Profil **mobile bawaan** dan throttling default Lighthouse; tidak mengubah skor dengan profil desktop, CPU/network yang lebih ringan atau mengurangi konten.
- Satu warm-up Lighthouse per URL, lalu **tiga pengukuran** tersimpan; median ketiganya menjadi nilai kelulusan. Tidak ada retry/cherry-pick run.
- Simpan semua JSON/HTML, termasuk warm-up, di `artifacts/lighthouse/` dan ringkasan `summary.json`. Dataset dibaca ulang pada akhir dan hash wajib sama.
- Jalankan terpisah dari build, instalasi, suite browser dan benchmark lain. Ini synthetic benchmark lokal, bukan RUM/hasil perangkat pengguna produksi.

Jika target gagal, catat audit/metric yang menjadi penyebab, perbaiki hanya sumber hambatan tersebut dan ulangi halaman terdampak dengan kondisi/dataset sama. Perbaikan tidak boleh mengurangi isi, aksesibilitas, privasi, no-store atau kontrol media. Jika semua median lulus, T058 mencatat tidak ada optimasi tambahan yang diperlukan.

Acuan metode: [Lighthouse scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring), [Node module API](https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md). Hasil aktual dicatat pada [laporan T063](../reports/T063.md).


## Hasil aktual setelah perbaikan startup CMS

| URL | Tiga skor tercatat | Median | Target |
|---|---|---|---|
| `/` | 88, 87, 88 | 88 | ≥85 |
| `/publikasi/artikel` | 87, 81, 91 | 87 | ≥85 |
| `/publikasi/artikel/demo-artikel-01` | 86, 82, 89 | 86 | ≥85 |
| `/kegiatan` | 91, 89, 89 | 89 | ≥85 |

Pengukuran dimulai 2026-11-02T16:28:44.544Z (UTC), 2 November 2026 WIB. Windows 10.0.26300, AMD Ryzen 7 6800H with Radeon Graphics (16 logical CPU), memori terbaca 15 GiB. Lighthouse 13.6.0; browser `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36`. Throttling simulated mobile default: RTT 150 ms, throughput 1638.4 Kbps, CPU slowdown 4×; emulasi layar 412×823. Tidak menghapus run lebih lambat.

Dataset hash sebelum/sesudah `2df17c4a81197aa3b13cc7de546ce04e40bdd4031f16d2aae8e6a953ec833837`; 24 artikel publik. Simpan 16 JSON + 16 HTML (termasuk empat warm-up), beserta settings/metric lengkap di `artifacts/lighthouse/summary.json`. Source snapshot baru `f1eed0c0428ab8a2a1c3ca52d2a6e48b1abf3759cf688e0160efa075cd473b49` dari parent commit `9e615bf`; bukan klaim bahwa parent commit memuat semua perubahan.

**T058: tidak diperlukan optimasi tambahan**, karena seluruh median melampaui target dengan kondisi/data yang sama. Kode aplikasi tidak berubah sesudah pengukuran; finalisasi dokumen tidak memengaruhi hasil. Hasil localhost/native PostgreSQL ini tidak memprediksi latency Supabase/hosting produksi. UI, data final atau infrastruktur yang berubah harus diukur ulang.
