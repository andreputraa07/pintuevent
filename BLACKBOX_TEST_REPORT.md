# Laporan Black-Box Testing PintuEvent

Tanggal pengujian: 26 Juli 2026

Environment: Chrome headless, desktop 1440×1000 dan mobile 390×844

Mode data: demo

Framework: Playwright

## Ringkasan akhir

| Gerbang kualitas                | Hasil       |
| ------------------------------- | ----------- |
| Prettier format check           | Lulus       |
| ESLint                          | Lulus       |
| TypeScript type-check           | Lulus       |
| Production build dan validation | Lulus       |
| Regression/service test         | 12/12 lulus |
| Black-box Playwright            | 18/18 lulus |

## Cakupan black-box

| ID    | Area                  | Skenario                                                      | Hasil |
| ----- | --------------------- | ------------------------------------------------------------- | ----- |
| BB-01 | Visual beranda        | Desktop lengkap, gambar termuat, tanpa overflow               | Lulus |
| BB-02 | Visual beranda        | Mobile lengkap, gambar termuat, tanpa overflow                | Lulus |
| BB-03 | Visual customer       | Dashboard dan checkout desktop, gambar termuat                | Lulus |
| BB-04 | Visual customer       | Dashboard dan tiket mobile, gambar termuat                    | Lulus |
| BB-05 | Route customer        | 13 route mobile bebas overflow, runtime error, dan mojibake   | Lulus |
| BB-06 | Route organizer/admin | 20 route mobile bebas overflow, runtime error, dan mojibake   | Lulus |
| BB-07 | Beranda               | Judul, hero, dan encoding teks tampil benar                   | Lulus |
| BB-08 | Beranda               | Kategori, pencarian, reset, favorit, promo, dan slug checkout | Lulus |
| BB-09 | Navigasi mobile       | Drawer menuju section event yang benar                        | Lulus |
| BB-10 | Auth customer         | Route terlindungi menyimpan `returnTo`                        | Lulus |
| BB-11 | Auth customer         | Login demo menuju dashboard                                   | Lulus |
| BB-12 | Keamanan auth         | Role asing dan external `returnTo` ditolak                    | Lulus |
| BB-13 | Otorisasi             | Role salah dan akun suspended dialihkan                       | Lulus |
| BB-14 | Customer              | Dashboard, detail tiket, QR, notifikasi, dan profil           | Lulus |
| BB-15 | Checkout              | Jumlah tiket, lima tahap checkout, dan pembayaran berhasil    | Lulus |
| BB-16 | Pembayaran            | Simulasi gagal dan kedaluwarsa memberikan hasil               | Lulus |
| BB-17 | Resource tidak valid  | ID tiket, pesanan, dan event tidak memakai data fallback      | Lulus |
| BB-18 | Organizer/admin       | Login, dashboard, role route, dan drawer mobile               | Lulus |

## Perbaikan yang divalidasi

- Workflow `dev`, `build`, `start`, `lint`, dan validasi artefak berjalan pada
  Windows tanpa mengubah helper Linux Sites.
- Redirect login dibatasi ke path internal dan role dinormalisasi.
- Pemeriksaan sesi customer hanya dilakukan satu kali dan memakai ID pengguna
  aktual saat Supabase aktif.
- Data Supabase dinormalisasi ke bentuk domain customer yang konsisten.
- Slug checkout bersifat eksplisit; resource tidak dikenal menampilkan empty
  state, bukan data pertama.
- Route customer bebas `any` eksplisit dan runtime Cloudflare/Deno dipisahkan
  pada type-check.
- Black-box visual menunggu gambar benar-benar selesai dimuat sebelum mengambil
  screenshot.
- Formatter dan gerbang `format`, `lint`, `typecheck`, build, regression, serta
  black-box tersedia melalui script npm.

## Perintah verifikasi

```text
npm run verify
npm run test:blackbox
```

Atau jalankan seluruh gerbang sekaligus:

```text
npm run test:all
```

## Batas pengujian

Supabase dan payment provider nyata belum dikonfigurasi pada environment lokal.
Karena itu transaksi nyata, webhook provider, RLS terhadap database remote,
upload storage remote, email, dan refund provider belum termasuk pengujian
end-to-end. Struktur query, normalisasi data, policy, RPC, dan alur mode demo
telah diperiksa pada source serta regression/black-box test.
