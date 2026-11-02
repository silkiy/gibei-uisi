# Metadata dan indeks demo

`SERVER_URL` harus berupa origin HTTPS atau HTTP loopback, tanpa credentials, path tambahan, query atau fragment. Canonical dibangun dari origin itu, bukan request Host. [Panduan metadata Next yang terpasang](../../node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md) menjadi acuan `generateMetadata`/`params` Promise.

Semua rute publik menyediakan title, description, canonical, Open Graph dan Twitter summary. Homepage/About memakai metadata versi Pages yang disetujui. Halaman detail memakai reader anonim yang sama dengan isi; Admin tidak mendapat metadata draft pada URL publik. Draft, revisi kerja, ID akun dan bukti izin logo tidak menjadi metadata. Gambar OG sengaja tidak mengambil file editor; summary teks tetap tersedia setelah revoke.

Semua metadata diberi `[Contoh / Pratinjau]` pada tahap localhost ini. `robots.txt` melarang seluruh crawling dan metadata serta header `X-Robots-Tag` tetap noindex/nofollow, termasuk bila dipasang di tunnel/staging. Tidak ada sakelar produksi yang otomatis mengizinkan indeks.

Sitemap dinamis membaca pointer publik beserta keputusan review yang valid, tanpa batas pagination daftar. Halaman statis yang memang tersedia selalu dicantumkan; detail artikel, riset, kegiatan, divisi dan album hanya jika terbit. Mitra/prestasi tidak memiliki route detail menurut PRD. Preview, API, CMS, draft dan URL asset tidak dicantumkan. Penarikan dinilai pada setiap request, termasuk URL sitemap yang sudah dipanaskan.

JSON-LD memakai Article untuk artikel/riset, CollectionPage untuk album, dan WebPage untuk informasi kegiatan contoh. Ia menyatakan materi contoh, tanpa klaim Organization/kemitraan/penghargaan/Event resmi yang belum diverifikasi. Tidak ada publisher/logo pribadi atau tujuan pendaftaran yang tersembunyi di structured data. Karakter `<` di-escape sebelum disisipkan dalam elemen script.

Perubahan indeks produksi, identitas organisasi, domain dan structured Event/Organization memerlukan validasi konten serta persiapan produksi tersendiri. QA keamanan, aksesibilitas dan Lighthouse menyeluruh tetap T052–T058.
