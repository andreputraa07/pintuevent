# Laporan Black-Box Testing PintuEvent

Tanggal pengujian: 26 Juli 2026  
Environment: Chrome headless, viewport desktop dan mobile, aplikasi mode demo  
Framework pengujian: Playwright

## Ringkasan

| Tahap | Berhasil | Gagal | Hasil |
| --- | ---: | ---: | --- |
| Pengujian awal | 3 | 8 | Ditemukan masalah aplikasi dan test harness |
| Pengujian setelah perbaikan | 14 | 0 | Lulus |
| Unit/service regression test | 10 | 0 | Lulus |
| Lint | 1 suite | 0 | Lulus |
| Production build | 1 build | 0 | Lulus |

## Matriks pengujian final

| ID | Area | Skenario | Hasil |
| --- | --- | --- | --- |
| BB-01 | Beranda | Judul, hero, dan teks tampil tanpa karakter encoding rusak | Berhasil |
| BB-02 | Beranda | Kategori memfilter event, pencarian dan reset bekerja | Berhasil |
| BB-03 | Beranda | Favorit dapat ditambah dan kode promo memberi notifikasi | Berhasil |
| BB-04 | Mobile | Drawer terbuka dan navigasi menuju section event yang benar | Berhasil |
| BB-05 | Auth | Route customer tanpa sesi dialihkan ke login dengan `returnTo` | Berhasil |
| BB-06 | Auth | Login demo customer menuju dashboard | Berhasil |
| BB-07 | Security | Role yang salah ditolak dan akun suspended dialihkan | Berhasil |
| BB-08 | Customer | Dashboard, detail tiket, QR, notifikasi, dan profil bekerja | Berhasil |
| BB-09 | Checkout | Jumlah tiket, total, lima tahap checkout, dan pembayaran berhasil | Berhasil |
| BB-10 | Payment | Simulasi pembayaran gagal dan kedaluwarsa memberi hasil | Berhasil |
| BB-11 | Organizer/Admin | Login, dashboard, route role, dan drawer mobile bekerja | Berhasil |
| BB-12 | Visual desktop | Dashboard dan checkout customer presisi tanpa horizontal overflow | Berhasil |
| BB-13 | Visual mobile | Dashboard dan tiket customer presisi tanpa horizontal overflow | Berhasil |
| BB-14 | Visual seluruh route | 13 route customer mobile bebas overflow dan runtime error | Berhasil |

## Masalah yang ditemukan dan diperbaiki

| ID | Masalah awal | Perbaikan | Retest |
| --- | --- | --- | --- |
| FIX-01 | Link “Jelajahi Event” pada menu mobile menuju anchor yang tidak ada | Menggunakan pemetaan anchor eksplisit ke `#event-pilihan` | Berhasil |
| FIX-02 | Form login dapat melakukan native GET sebelum React selesai hydration | Tombol submit dinonaktifkan sampai hydration selesai | Berhasil |
| FIX-03 | Tombol menu dapat ditekan sebelum handler interaktif siap | Menambahkan hydration guard pada tombol menu | Berhasil |
| FIX-04 | Image optimizer lokal crash ketika binding Cloudflare belum tersedia | Menambahkan fallback aset lokal yang membatasi sumber ke path internal | Berhasil |
| FIX-05 | Lazy-loaded QR Code tidak kompatibel dengan interop module Vinext | Dynamic import diarahkan secara eksplisit ke default export | Berhasil |
| FIX-06 | Tombol pembayaran gagal dan kedaluwarsa tidak melakukan apa pun | Menghubungkan service simulasi dan menampilkan status hasil | Berhasil |
| FIX-07 | Lint ikut memeriksa artefak build/runtime | Menambahkan ignore untuk `.sites-runtime` dan artefak Playwright | Berhasil |

## Perintah verifikasi

```text
npm run test:blackbox
npm run lint
npm test
```

## Batas pengujian

Supabase dan payment provider nyata belum dikonfigurasi pada environment ini. Karena itu, transaksi nyata, webhook provider, RLS terhadap database remote, upload storage, email, dan refund provider tidak termasuk pengujian end-to-end ini. Alur yang tersedia dalam mode demo telah lulus seluruh pengujian.
